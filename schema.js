const _ = require('lodash')
const axios = require('axios')
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString)
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')

const BookType = new GraphQLObjectType({
  name: 'Book',
  description: '...',

  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.book[0].title[0]
    },
    isbn: {
      type: GraphQLString,
      resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
    }
  })
})

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: '...',

  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: xml =>
        xml.GoodreadsResponse.author[0].name[0]
    },
    imageUrl: {
      type: GraphQLString,
      resolve: xml =>
        xml.GoodreadsResponse.author[0].image_url[0]
    },
    books: {
      type: new GraphQLList(BookType),
      resolve: xml => {
        const ids = xml.GoodreadsResponse.author[0].books[0].book.map(b => b.id[0]._)
        return Promise.all(
          ids.map(id =>
            axios.get(`https://www.goodreads.com/book/show/${id}.xml?key=wcYs8rK8zVhJxiHdtTHiSg`)
              .then(response => response.data)
              .then(parseXML)
          )
        )
      }
    }
  })
})

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    description: '...',
    
    fields: () => ({
      author: {
        type: AuthorType,
        args: {
          id: { type: GraphQLInt }
        },
        resolve: (root, args) => axios.get(
          `https://www.goodreads.com/author/show.xml?id=${args.id}&key=wcYs8rK8zVhJxiHdtTHiSg`
        )
        .then(response => response.data)
        .then(parseXML)
      }
    })
  })
})
