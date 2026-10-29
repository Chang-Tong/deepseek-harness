import {describe,it,expect} from 'vitest'
import {imagePreviewId} from '../src/client/image-result.ts'

describe('downloaded illustration preview',()=>{
  it('uses a saved hash identity instead of a server-supplied URL or path',()=>{
    const id='a'.repeat(64)
    expect(imagePreviewId([{type:'text',text:JSON.stringify({id,preview_url:'https://unrelated.example/image.png'})}])).toBe(id)
    for(const text of ['plain diagnostic','null','{}','{"id":"../secret"}','{"preview_url":"javascript:alert(1)"}']) expect(imagePreviewId([{type:'text',text}])).toBeUndefined()
    expect(imagePreviewId([null,{type:'image'},'text'])).toBeUndefined()
  })
})
