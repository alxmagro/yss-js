import { schema } from '../../../index.js'

const validatePost  = schema.fromFile(new URL('./post.yaml', import.meta.url).pathname)
const validatePosts = schema.fromFile(new URL('./posts.yaml', import.meta.url).pathname)

const validPost = {
  data: {
    id:        1,
    title:     'The Force Awakens',
    slug:      'the-force-awakens',
    body:      'A long time ago in a galaxy far, far away...',
    published: true,
  },
  meta: { author: 'Luke', views: 9999 },
}

const invalidPost = {
  data: {
    id:        0,             // below min
    title:     '',            // below min
    slug:      'Not A Slug',  // invalid pattern
    body:      '',            // below min
    published: true,
  },
  meta: null,                 // any - should pass
}

describe('integration - imported_posts', () => {
  describe('post.yaml (standalone)', () => {
    test('valid post passes', () => {
      expect(validatePost(validPost)).toEqual([])
    })

    test('meta accepts any value', () => {
      expect(validatePost({ ...validPost, meta: 42 })).toEqual([])
      expect(validatePost({ ...validPost, meta: [1, 2] })).toEqual([])
      expect(validatePost({ ...validPost, meta: null })).toEqual([])
    })

    test('invalid post.data returns expected errors', () => {
      const errors = validatePost(invalidPost)
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'data.id',    code: 'gte_invalid'   }),
        expect.objectContaining({ path: 'data.title', code: 'min_invalid'   }),
        expect.objectContaining({ path: 'data.slug',  code: 'match_invalid' }),
        expect.objectContaining({ path: 'data.body',  code: 'min_invalid'   }),
      ]))
    })
  })

  describe('posts.yaml ($ref with dot navigation to post.data)', () => {
    test('valid list of posts passes', () => {
      expect(validatePosts({ data: [validPost.data], meta: null })).toEqual([])
    })

    test('meta accepts any value', () => {
      expect(validatePosts({ data: [validPost.data], meta: { total: 1 } })).toEqual([])
      expect(validatePosts({ data: [validPost.data], meta: 'string' })).toEqual([])
    })

    test('invalid post inside list returns errors with correct path', () => {
      const errors = validatePosts({ data: [validPost.data, invalidPost.data], meta: null })
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'data[1].id',    code: 'gte_invalid'   }),
        expect.objectContaining({ path: 'data[1].title', code: 'min_invalid'   }),
        expect.objectContaining({ path: 'data[1].slug',  code: 'match_invalid' }),
        expect.objectContaining({ path: 'data[1].body',  code: 'min_invalid'   }),
      ]))
    })

    test('slug pattern from post.yaml resolves correctly via $ref navigation', () => {
      const post = { ...validPost.data, slug: 'valid-slug-123' }
      expect(validatePosts({ data: [post], meta: null })).toEqual([])

      const errors = validatePosts({ data: [{ ...validPost.data, slug: 'INVALID SLUG' }], meta: null })
      expect(errors.some(e => e.path === 'data[0].slug' && e.code === 'match_invalid')).toBe(true)
    })
  })
})
