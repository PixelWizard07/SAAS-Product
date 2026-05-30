const Settings = require('../models/Settings');

const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) settings = await Settings.create({ userId: req.user.id });
    res.json(settings);
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };
