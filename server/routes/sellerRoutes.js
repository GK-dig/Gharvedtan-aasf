const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Seller = mongoose.model('Seller');


router.post('/', async (req, res) => {
  try {
    const newSeller = new Seller(req.body);
    const savedSeller = await newSeller.save();
    res.status(201).json(savedSeller);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updated = await Seller.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Seller.findByIdAndDelete(req.params.id);
    res.json({ message: 'Seller deleted', deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
