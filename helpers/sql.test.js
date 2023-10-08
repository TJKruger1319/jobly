const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql")

describe("sqlForPartialUpdate", function() {
    test("Gets expected output", function() {
        const dataToUpdate = {firstName: 'Aliya', age: 32};
        const jsToSql = { firstName: "first_name", age: "age" };
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(setCols).toEqual('"first_name"=$1, "age"=$2');
        expect(values).toEqual(['Aliya, 32']);
    });

    test("Gets error if no data", function(){
        try {
            const { setCols, values } = sqlForPartialUpdate("", "");
        } catch (e) {
            expect(e instanceof BadRequestError).toBeTruthy();
        }
    })
});