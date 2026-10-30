import { lessonSchema, validateUpload } from './schemas'

const base = {
  title: 'Intro',
  description: '',
  lesson_type: 'video' as const,
  source: 'url' as const,
  content_url: '',
  content_text: '',
  duration_minutes: '',
  is_required: true,
  is_published: false,
  hasFile: false,
}

describe('lessonSchema', () => {
  it('lets a draft be incomplete', () => {
    expect(lessonSchema.safeParse(base).success).toBe(true)
  })
  it('requires a link to publish a link-based lesson', () => {
    const r = lessonSchema.safeParse({ ...base, is_published: true })
    expect(r.success).toBe(false)
  })
  it('accepts a published lesson with a link', () => {
    expect(
      lessonSchema.safeParse({ ...base, is_published: true, content_url: 'https://youtu.be/x' })
        .success,
    ).toBe(true)
  })
  it('rejects non-http links even in drafts', () => {
    expect(lessonSchema.safeParse({ ...base, content_url: 'javascript:alert(1)' }).success).toBe(
      false,
    )
  })
  it('requires a file to publish an upload-based lesson', () => {
    expect(lessonSchema.safeParse({ ...base, source: 'upload', is_published: true }).success).toBe(
      false,
    )
    expect(
      lessonSchema.safeParse({ ...base, source: 'upload', is_published: true, hasFile: true })
        .success,
    ).toBe(true)
  })
  it('requires text to publish a text lesson', () => {
    expect(
      lessonSchema.safeParse({ ...base, lesson_type: 'text', is_published: true }).success,
    ).toBe(false)
    expect(
      lessonSchema.safeParse({
        ...base,
        lesson_type: 'text',
        is_published: true,
        content_text: 'hi',
      }).success,
    ).toBe(true)
  })
  it('validates duration', () => {
    expect(lessonSchema.safeParse({ ...base, duration_minutes: '0' }).success).toBe(false)
    expect(lessonSchema.safeParse({ ...base, duration_minutes: '12' }).success).toBe(true)
  })
})

describe('validateUpload', () => {
  it('checks type and size', () => {
    expect(validateUpload(new File(['x'], 'a.pdf', { type: 'application/pdf' }), 'pdf')).toBeNull()
    expect(validateUpload(new File(['x'], 'a.png', { type: 'image/png' }), 'pdf')).toMatch(/PDF/)
    expect(validateUpload(new File(['x'], 'a.mp4', { type: 'video/mp4' }), 'pdf')).toMatch(/PDF/)
  })
})
