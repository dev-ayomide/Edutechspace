import { moveItem } from './reorder'

describe('moveItem', () => {
  const list = ['a', 'b', 'c']
  it('moves an item up and down', () => {
    expect(moveItem(list, 1, 'up')).toEqual(['b', 'a', 'c'])
    expect(moveItem(list, 1, 'down')).toEqual(['a', 'c', 'b'])
  })
  it('does nothing at the ends or for bad indexes', () => {
    expect(moveItem(list, 0, 'up')).toEqual(list)
    expect(moveItem(list, 2, 'down')).toEqual(list)
    expect(moveItem(list, 9, 'up')).toEqual(list)
  })
  it('does not mutate the input', () => {
    moveItem(list, 0, 'down')
    expect(list).toEqual(['a', 'b', 'c'])
  })
})
