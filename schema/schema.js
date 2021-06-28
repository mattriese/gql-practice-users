const graphql = require('graphql');
const axios = require('axios');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType), //don't need args: here cuz just going from one company, no need.
    resolve(parentValue, args) { //parentValue is sorta like 'this', the current instance of company that we're working with
      return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
        .then(resp => resp.data);
    }
    }
  })
})

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) { //this resolve fcn should return the company that is associated with a given user
        return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  })
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType, // query will give back a thing of type UserType
      args: { id: { type: GraphQLString } }, //required args (what will go in parents after the query)
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/users/${args.id}`) // its restful routing under the hood! this is how it chooses a root node for the query!
          .then(resp => resp.data);
      }
     },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } }, //required args
      resolve(parentValue, args) {
        return axios.get(`http://localhost:3000/companies/${args.id}`) // its restful routing under the hood! this is how it chooses a root node for the query!
          .then(resp => resp.data);
      }
     }
    }
});

const mutation = new GraphQLObjectType({
  name: 'Mutatiion',
  fields: {
    addUser: {
      type: UserType, // this is the type that the resolve fcn will return, which isn't always the same type that you are working on
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
        return axios.post('http://localhost:3000/users', { firstName, age })
          .then(resp => resp.data);
      }
    },
    deleteUser: {
      type: UserType, // this is the type that the resolve fcn will return, which isn't always the same type that you are working on
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve(parentValue, {id} ) {
        return axios.delete(`http://localhost:3000/users/${id}`)
          .then(resp => resp.data);
      }
    },
    editUser: {
      type: UserType, // this is the type that the resolve fcn will return, which isn't always the same type that you are working on
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios.patch(`http://localhost:3000/users/${args.id}`, args)
          .then(resp => resp.data);
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation
});
