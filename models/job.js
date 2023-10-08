"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

// Related functions for jobs

class Job {
    /** Create a job (using data), update db, return new job data.
     * 
     * data should look like { title, salary, equity, companyHandle }
     * 
     * Returns { id, title, salary, equity, companyHandle }
     */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING title, salary, equity, company_handle AS "companyHandle"`
        [
            title,
            salary,
            equity,
            companyHandle
        ]);
        const job = result.rows[0];

        return job;
    }

    /** Find all companies (optional filter on searchFilters) 
     * 
     * searchFilters (optional):
     * - title
     * - minSalary
     * - hasEquity
     * 
     * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
    */

    static async findAll(searchFilters = {}) {
        let query = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS companyName
                    FROM jobs j
                      LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        let whereExpressions = [];
        let queryValues = [];

        const { title, minSalary, hasEquity } = searchFilters;
        
        // For each possible search term, ass to whereExpressions and queryValues
        // to create the correct sql


        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (hasEquity !== undefined) {
            queryValues.push(hasEquity);
            whereExpressions.push(`equity > 0`);
        }

        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        query += " ORDER BY title";
        const jobRes = await db.query(query, queryValues);
        return jobRes.rows;
    }

    /** Given a job id, return data about the job
     * 
     * Returns { id, title, salary, equity, companyHandle, company}
     *     where company is { handle, name, description, numEmployees, logoUrl }
     * 
     * Throws NotFoundError if not found
     */

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`, [id]);
  
      const job = jobRes.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
  
      const companiesRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`, [job.companyHandle]);
  
      delete job.companyHandle;
      job.company = companiesRes.rows[0];
  
      return job;
    }

      /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {}
        );
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle as "companyHandle"`;
        const results = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }
    
    /** Delete a certain job from database. Returns with undefined.
     *  
     * Throws NotFoundError if job is not found.
     */

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
        [id])
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;