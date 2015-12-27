module.exports = function (path, user) {
  if (!user.u || !user.p) {
    throw new Error('you must authenticate your db using -u and -p flags');
  }
  return `mongoimport --host localhost --db foobar -u ${user.u} -p ${user.p} --authenticationDatabase foobar --collection posts < ${path} --jsonArray`;
};