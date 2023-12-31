const router = require("express").Router();
const Customer = require("../models/cutomerModel");
const auth = require("../middleware/auth");

router.post("/", auth, async(req, res) => {
    try {
        const {name} = req.body;
        
        const newCustomer = new Customer({
            name,
        })
        const savedCustomer = await newCustomer.save();

        res.json(savedCustomer);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

module.exports = router;