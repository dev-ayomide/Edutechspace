import { asList } from './embed'

describe('asList', () => {
  it('turns a one-to-one embed into a list', () => {
    expect(asList(null)).toEqual([])
    expect(asList(undefined)).toEqual([])
    expect(asList({ id: 'a' })).toEqual([{ id: 'a' }])
    expect(asList([{ id: 'a' }, { id: 'b' }])).toEqual([{ id: 'a' }, { id: 'b' }])
  })
})
