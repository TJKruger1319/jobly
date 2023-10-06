const { BadRequestError } = require("../expressError");

/**
 * Helper function that transforms data into SQL readable format
 * 
 * This is to be used with the SET clause of an SQL UPDATE statement.
 * 
 * 
 * @param dataToUpdate {object} {entry1: val1, entry2: val2, ...}
 * @param jsToSql {object} maps js-style data fields to database column names
 * 
 * @returns {Object} {sqlSetCols, dataToUpdate}
 * 
 * @example {firstName: 'Shawn', age: 19} =>
 *  { setCols: '"first_name"=$1, "age"=$2',
 *  values: ['Shawn', 19]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
