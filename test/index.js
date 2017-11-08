const { graphql, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLList } = require('graphql');
const { expect } = require('chai');

const GraphQLSafeObjectType = require('../src');

describe('GraphQLSafeObjectType', () => {
  function buildSchema(safeObject, data) {
    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          user: {
            type: safeObject,
            args: {
              id: { type: GraphQLInt }
            },
            resolve: () => data
          }
        }
      })
    });
  }

  it('acts as normal GraphQLObjectType if value found', done => {
    const data = { username: 'foobar' };

    const safeObject = new GraphQLSafeObjectType({
      name: 'SafeObject',
      fields: {
        username: {
          type: GraphQLString,
          notFoundValue: 'unknown'
        }
      }
    });

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'foobar'
    };

    const query = `
      query {
        user { username }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('returns null if value not found and notFoundValue not supplied', done => {
    const data = { name: 'Foo' };

    const safeObject = new GraphQLSafeObjectType({
      name: 'SafeObject',
      fields: {
        username: {
          type: GraphQLString
        }
      }
    });

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: null
    };

    const query = `
      query {
        user { username }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('returns notFoundValue [if supplied] if value not found', done => {
    const data = { name: 'Foo' };

    const safeObject = new GraphQLSafeObjectType({
      name: 'SafeObject',
      fields: {
        username: {
          type: GraphQLString,
          notFoundValue: 'unknown'
        }
      }
    });

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'unknown'
    };

    const query = `
      query {
        user { username }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('acts as normal GraphQLObjectType with nested objects when values found', done => {
    const data = {
      username: 'foobar',
      location: {
        city: 'Boston',
        state: 'MA',
        contact: {
          name: 'John'
        }
      }
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

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'foobar',
      location: {
        city: 'Boston',
        state: 'MA',
        contact: {
          name: 'John'
        }
      }
    };

    const query = `
      query {
        user {
          username,
          location {
            city,
            state,
            contact { name }
          }
        }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('returns empty nested objects with children when parent value not found', done => {
    const data = { username: 'foobar' };

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

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'foobar',
      location: {
        city: null,
        state: null,
        contact: {
          name: null
        }
      }
    };

    const query = `
      query {
        user {
          username,
          location {
            city,
            state,
            contact { name }
          }
        }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('acts as normal GraphQLObjectType with nested GraphQLList when value found', done => {
    const data = {
      username: 'foobar',
      locations: [
        {
          city: 'Boston',
          state: 'MA',
          contact: {
            name: 'John'
          }
        },
        {
          city: 'Denver',
          state: 'CO',
          contact: {
            name: 'Jane'
          }
        }
      ]
    };

    const safeObject = new GraphQLSafeObjectType({
      name: 'SafeObject',
      fields: {
        username: {
          type: GraphQLString,
          notFoundValue: 'unknown'
        },
        locations: {
          type: new GraphQLList(
            new GraphQLSafeObjectType({
              name: 'Location',
              fields: {
                city: { type: GraphQLString },
                state: { type: GraphQLString },
                contact: {
                  type: new GraphQLSafeObjectType({
                    fields: {
                      name: { type: GraphQLString }
                    }
                  })
                }
              }
            })
          )
        }
      }
    });

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'foobar',
      locations: [
        {
          city: 'Boston',
          state: 'MA',
          contact: {
            name: 'John'
          }
        },
        {
          city: 'Denver',
          state: 'CO',
          contact: {
            name: 'Jane'
          }
        }
      ]
    };

    const query = `
      query {
        user {
          username,
          locations {
            city,
            state,
            contact { name }
          }
        }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('returns empty nested objects and lists with children when parent value not found', done => {
    const data = {
      username: 'foobar',
      locations: [
        {
          contact: {
            name: 'John'
          }
        }
      ]
    };

    const safeObject = new GraphQLSafeObjectType({
      name: 'SafeObject',
      fields: {
        username: {
          type: GraphQLString,
          notFoundValue: 'unknown'
        },
        locations: {
          type: new GraphQLList(
            new GraphQLSafeObjectType({
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
          )
        }
      }
    });

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'foobar',
      locations: [
        {
          city: null,
          state: null,
          contact: {
            name: 'John'
          }
        }
      ]
    };

    const query = `
      query {
        user {
          username,
          locations {
            city,
            state,
            contact { name }
          }
        }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });

  it('returns empty list if no elements found in GraphQLList type', done => {
    const data = { username: 'foobar' };

    const safeObject = new GraphQLSafeObjectType({
      name: 'SafeObject',
      fields: {
        username: {
          type: GraphQLString,
          notFoundValue: 'unknown'
        },
        locations: {
          type: new GraphQLList(
            new GraphQLSafeObjectType({
              name: 'Location',
              fields: {
                city: { type: GraphQLString },
                state: { type: GraphQLString },
                contact: {
                  type: new GraphQLSafeObjectType({
                    fields: {
                      name: { type: GraphQLString }
                    }
                  })
                }
              }
            })
          )
        }
      }
    });

    const schema = buildSchema(safeObject, data);

    const expected = {
      username: 'foobar',
      locations: []
    };

    const query = `
      query {
        user {
          username,
          locations {
            city,
            state,
            contact { name }
          }
        }
      }
    `;

    graphql(schema, query)
      .then(({ data }) => {
        expect(data.user).to.eql(expected);
        done();
      })
      .catch(done);
  });
});
