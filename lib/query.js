module.exports = function (path, auth) {
  if (!auth.u || !auth.p || !auth.c || !auth.d) {
    throw new Error('please ensure all flags (-u, -p, -d, -c) are set');
  }
  return `mongoimport --host localhost --db ${auth.d} -u ${auth.u} -p ${auth.p} --authenticationDatabase ${auth.d} --collection ${auth.c} < ${path} --jsonArray`;
};