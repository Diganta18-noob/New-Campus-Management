const Setting = require('../models/InstitutionSetting.model');
const User = require('../models/User.model');
const get = async (req, res, next) => { try {
  const data = await Setting.findById('institution').lean() || { name: 'AttendEase Campus', contactEmail: '', retentionDays: 365, timeZone: 'UTC' };
  res.json({ success: true, data });
} catch (error) { next(error); } };
const update = async (req, res, next) => { try {
  const { name, contactEmail, retentionDays } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 160) return res.status(400).json({ success: false, message: 'Valid institution name is required' });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return res.status(400).json({ success: false, message: 'Valid contact email is required' });
  if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650) return res.status(400).json({ success: false, message: 'Retention must be 30 to 3650 days' });
  const data = await Setting.findByIdAndUpdate('institution', { $set: { name: name.trim(), contactEmail: contactEmail || '', retentionDays, timeZone: 'UTC', updatedBy: req.user._id } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ success: true, data });
} catch (error) { next(error); } };
const getMine = async (req, res, next) => { try {
  const user = await User.findById(req.user._id).select('notificationPreferences').lean();
  res.json({ success: true, data: { announcements: user?.notificationPreferences?.announcements ?? true, calendar: user?.notificationPreferences?.calendar ?? true } });
} catch (error) { next(error); } };
const updateMine = async (req, res, next) => { try {
  const { announcements, calendar } = req.body;
  if (typeof announcements !== 'boolean' || typeof calendar !== 'boolean') return res.status(400).json({ success: false, message: 'Preferences must be booleans' });
  await User.updateOne({ _id: req.user._id }, { $set: { 'notificationPreferences.announcements': announcements, 'notificationPreferences.calendar': calendar } });
  res.json({ success: true, data: { announcements, calendar } });
} catch (error) { next(error); } };
module.exports = { get, update, getMine, updateMine };
