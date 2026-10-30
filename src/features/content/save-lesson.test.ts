import type { Lesson } from '@/types/domain'
import * as api from './api'
import type { LessonInput } from './schemas'
import { saveLessonWithFile } from './save-lesson'

vi.mock('./api')

const input: LessonInput = {
  title: 'Lesson',
  description: '',
  lesson_type: 'pdf',
  source: 'upload',
  content_url: '',
  content_text: '',
  duration_minutes: '',
  is_required: true,
  is_published: false,
  hasFile: true,
}
const pdf = new File(['x'], 'notes.pdf', { type: 'application/pdf' })
const existing = { id: 'l1', lesson_type: 'pdf', content_path: 'old/path.pdf' } as Lesson

describe('saveLessonWithFile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.uploadLessonFile).mockResolvedValue('stack/module/new.pdf')
  })

  it('uploads a new file and saves its path', async () => {
    await saveLessonWithFile({ stackId: 's', moduleId: 'm', input, file: pdf, existing: null })
    expect(api.uploadLessonFile).toHaveBeenCalledWith('s', 'm', pdf)
    expect(api.saveLesson).toHaveBeenCalledWith(
      'm',
      { input, contentPath: 'stack/module/new.pdf' },
      undefined,
    )
    expect(api.removeLessonFile).not.toHaveBeenCalled()
  })

  it('removes the new upload again when saving fails', async () => {
    vi.mocked(api.saveLesson).mockRejectedValue(new Error('boom'))
    await expect(
      saveLessonWithFile({ stackId: 's', moduleId: 'm', input, file: pdf, existing: null }),
    ).rejects.toThrow('boom')
    expect(api.removeLessonFile).toHaveBeenCalledWith('stack/module/new.pdf')
  })

  it('keeps the existing file when no new file is chosen', async () => {
    await saveLessonWithFile({ stackId: 's', moduleId: 'm', input, file: null, existing })
    expect(api.uploadLessonFile).not.toHaveBeenCalled()
    expect(api.saveLesson).toHaveBeenCalledWith('m', { input, contentPath: 'old/path.pdf' }, 'l1')
    expect(api.removeLessonFile).not.toHaveBeenCalled()
  })

  it('removes the old file once it has been replaced', async () => {
    await saveLessonWithFile({ stackId: 's', moduleId: 'm', input, file: pdf, existing })
    expect(api.removeLessonFile).toHaveBeenCalledWith('old/path.pdf')
  })

  it('removes the old file when switching to a link', async () => {
    await saveLessonWithFile({
      stackId: 's',
      moduleId: 'm',
      input: { ...input, source: 'url', content_url: 'https://a.b' },
      file: null,
      existing,
    })
    expect(api.saveLesson).toHaveBeenCalledWith(
      'm',
      expect.objectContaining({ contentPath: null }),
      'l1',
    )
    expect(api.removeLessonFile).toHaveBeenCalledWith('old/path.pdf')
  })

  it('does not reuse a stored file when the lesson type changes', async () => {
    await saveLessonWithFile({
      stackId: 's',
      moduleId: 'm',
      input: { ...input, lesson_type: 'video' },
      file: null,
      existing,
    })
    expect(api.saveLesson).toHaveBeenCalledWith(
      'm',
      expect.objectContaining({ contentPath: null }),
      'l1',
    )
  })
})
