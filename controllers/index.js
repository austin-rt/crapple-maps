const { User, Listing } = require('../models');

const createUser = async (req, res) => {
  try {
    const user = await new User(req.body);
    await user.save();
    return res.status(201).json({
      user,
    });
  } catch (e) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ users });
  } catch (e) {
    return res.status(500).send(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, req.body, { new: true }, (err, user) => {
      if (err) {
        res.status(500).send(err);
      }
      if (!user) {
        res.status(500).send('User not found!');
      }
      return res.status(200).json(user);
    });
  } catch (e) {
    return res.status(500).send(error.message);
  }
};

const createListing = async (req, res) => {
  try {
    const listing = await new Listing(req.body);
    await listing.save();
    return res.status(201).json({
      listing,
    });
  } catch (e) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllListings = async (req, res) => {
  try {
    const listings = await Listing.find();
    return res.status(200).json({ listings });
  } catch (e) {
    return res.status(500).send(error.message);
  }
};

const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (listing) {
      return res.status(200).json({ listing });
    }
    return res.status(404).send('Listing does not exist');
  } catch (e) {
    return res.status(500).send(error.messahe);
  }
};

const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, req.body, { new: true }, (err, listing) => {
      if (err) {
        res.status(500).send(err);
      }
      if (!listing) {
        res.status(500).send('Listing not found!');
      }
      return res.status(200).json(listing);
    });
  } catch (e) {
    return res.status(500).send(error.message);
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Listing.findByIdAndDelete(id);
    if (deleted) {
      return res.status(200).send("Listing deleted");
    }
    throw new Error("Listing not found");
  } catch (e) {
    return res.status(500).send(e.message);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  updateUser,
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing
};