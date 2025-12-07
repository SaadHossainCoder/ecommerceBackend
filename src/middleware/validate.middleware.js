// src/middleware/validate.js
export const validate =
    (schema) =>
        (req, res, next) => {
            try {
                schema.parse({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                });
                next();
            } catch (e) {
                return res.status(400).json({ error: e.errors });
            }
        };
