import { render } from '@testing-library/react'
import { expectAccessible } from './a11y'

describe('the accessibility check itself', () => {
  it('passes accessible markup', async () => {
    const { container } = render(
      <main>
        <h1>Title</h1>
        <label htmlFor="x">Name</label>
        <input id="x" />
        <button>Save</button>
      </main>,
    )
    await expectAccessible(container)
  })

  it('catches an unlabelled button, an unlabelled input and an image without alt', async () => {
    const { container } = render(
      <div>
        <button />
        <input />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- deliberately broken markup for the checker */}
        <img src="x.png" />
      </div>,
    )
    await expect(expectAccessible(container)).rejects.toThrow()
  })
})
