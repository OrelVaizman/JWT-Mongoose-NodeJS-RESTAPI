const Team = require('../models/team');
const User = require('../models/user');
const Mongoose = require('mongoose');
const { handleErrors } = require('../utils/utils');
const create = async ({ body, loggedInUserId }, res) => {
	const { name } = body;
	try {
		const team = await Team.create({ name, members: [{ userId: loggedInUserId, isManager: true }] });
		res.status(200).send(team);
	} catch (err) {
		const errors = handleErrors(err);
		res.status(400).send(errors);
	}
};

const addMember = async ({ team, body }, res) => {
	let { userId } = body;
	userId = userId.toString();
	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(400).send('The user does not exist in our system!');
		}
		const isUniqueToTeam = team.members.every((member) => member.userId.toString() !== userId);
		if (!isUniqueToTeam) {
			return res.status(400).send('This user is already a member of the team!');
		}
		team.members.push({ userId, isManager: false });
		await team.save();
		res.status(200).send(team);
	} catch (err) {
		const errors = handleErrors(err);
		res.status(400).send(errors);
	}
};

const updateMember = async ({ body, team }, res) => {
	let { userId, teamId, isManager } = body;
	userId = typeof userId === 'string' ? userId : userId.toString();
	const updatedMembers = team.members.map((member) =>
		member.userId.toString() === userId ? { userId, isManager } : member
	);
	try {
		const updatedTeam = await Team.findByIdAndUpdate({ _id: teamId }, { members: updatedMembers }, { new: true });
		res.status(200).send(updatedTeam);
	} catch (err) {
		const errors = handleErrors(err);
		res.status(400).send(errors);
	}
};

const deleteTeam = async ({ team }, res) => {
	try {
		const deletedTeam = await team.delete();
		res.status(200).send(deletedTeam);
	} catch (err) {
		const errors = handleErrors(err);
		res.status(400).send(errors);
	}
};

const deleteMember = async ({ team, loggedInUserId, body }, res) => {
	let { userId, teamId } = body;
	userId = typeof userId === 'string' ? userId : userId.toString();
	if (userId === loggedInUserId) {
		return res.status(400).send('You cannot remove yourself from the team!');
	}
	const updatedMembers = team.members.filter((member) => member.userId.toString() !== userId);
	const updatedTeam = await Team.findByIdAndUpdate({ _id: teamId }, { members: updatedMembers }, { new: true });
	res.status(200).send(updatedTeam);
};

module.exports = {
	create,
	addMember,
	updateMember,
	deleteTeam,
	deleteMember,
};
