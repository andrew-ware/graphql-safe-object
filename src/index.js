const { GraphQLObjectType } = require('graphql');
const _ = require('lodash');

function getDefaultNotFoundValueByType(type) {
  const isOfType = typeString => _.endsWith(_.toString(type), typeString);

  switch (true) {
    case isOfType('SafeObject'): {
      return {};
    }
    case isOfType('SafeObject]'): {
      // List of SafeObjects
      return [{}];
    }
    case isOfType(']'): {
      // List of other type
      return [];
    }
    default: {
      return null;
    }
  }

  return null;
}

function getParsedNotFoundValue(notFoundValue, type) {
  if (!_.isUndefined(notFoundValue)) {
    return notFoundValue;
  }

  return getDefaultNotFoundValueByType(type) || null;
}

class GraphQLSafeObjectType extends GraphQLObjectType {
  constructor(options, notFoundDefaults) {
    const customFields = _.toPairs(options.fields)
      .map(([fieldName, fieldObj]) => {
        const type = fieldObj.type;

        const notFoundValue = fieldObj.notFoundValue;
        const value = fieldObj[fieldName];
        const resolv = fieldObj.resolve || _.identity;

        const newFieldObj = _.assign({}, fieldObj, {
          resolve: resp => {
            const resolved = resolv(resp[fieldName]);

            if (_.isNil(resolved)) {
              return getParsedNotFoundValue(notFoundValue, type);
            }

            return resolved;
          }
        });

        return {
          [fieldName]: newFieldObj
        };
      })
      .reduce(_.merge);

    const fields = _.assign({}, options.fields, customFields);

    super(_.assign({}, options, { fields, name: `${options.name}SafeObject` }));
  }
}

module.exports = GraphQLSafeObjectType;
