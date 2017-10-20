# graphql-safe-object

GraphQLSafeObjectType for [GraphQL.js](https://github.com/graphql/graphql-js) is an extension of GraphQLObjectType with the added ability to return its children when null.

Allows return of empty children elements when parent is not found, rather than returning null with no children elements.

## Basic Usage

```js
import { graphql, GraphQLSchema, GraphQLString } from 'graphql';
import GraphQLSafeObjectType from 'graphql-safe-object';

const data = {
  username: 'jsmith'
};

const safeObject = new GraphQLSafeObjectType({
  name: 'SafeObject',
  fields: {
    username: {
      type: GraphQLString,
      notFoundValue: 'unknown'
    },
    location: {
      type: new GraphQLSafeObjectType({
        name: 'Location',
        fields: {
          city: { type: GraphQLString },
          state: { type: GraphQLString },
          contact: {
            type: new GraphQLSafeObjectType({
              name: 'Contact',
              fields: {
                name: { type: GraphQLString }
              }
            })
          }
        }
      })
    }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      user: {
        type: safeObject,
        resolve: () => data
      }
    }
  })
});

graphql(schema, `
  query {
    user {
      username,
      location {
        city,
        state,
        contact {
          name
        }
      }
    }
  }
`)
  .then(({ data: { user } }) => {
    /**
     * user = {
     *   username: 'jsmith',
     *   location: {
     *     city: null,
     *     state: null,
     *     contact: {
     *       name: null
     *     }
     *   }
     * }
     */
     
    doSomething(user.location.contact.name); // won't cause an exception
  });
```


## Advanced Usage

You can also provide a `notFoundValue`, which will override the default internal notFoundValue of that type or null.

```js
...

const safeObject = new GraphQLSafeObjectType({
  name: 'SafeObject',
  fields: {
    username: {
      type: GraphQLString,
      notFoundValue: 'unknown'
    },
    location: {
      type: new GraphQLSafeObjectType({
        name: 'Location',
        fields: {
          city: { type: GraphQLString, notFoundValue: 'Boston' },
          state: { type: GraphQLString, notFoundValue: 'MA' },
          contact: {
            type: new GraphQLSafeObjectType({
              name: 'Contact',
              fields: {
                name: { type: GraphQLString }
              }
            })
          }
        }
      })
    }
  }
});

...

graphql(schema, `
  query {
    user {
      username,
      location {
        city,
        state,
        contact {
          name
        }
      }
    }
  }
`)
  .then(({ data: { user } }) => {
    /**
     * user = {
     *   username: 'jsmith',
     *   location: {
     *     city: 'Boston',
     *     state: 'MA',
     *     contact: {
     *       name: null
     *     }
     *   }
     * }
     */
     
    doSomething(user.location.city); // Boston
  });
```