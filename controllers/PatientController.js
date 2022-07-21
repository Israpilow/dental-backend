const { Patient, Appointment } = require("../models");
const { validationResult } = require("express-validator");

function PatientController() {}

const create = function (req, res) {
  const errors = validationResult(req);
  const data = {
    fullname: req.body.fullname,
    phone: req.body.phone,
  };
  if (!errors.isEmpty()) {
    return res.status(422).json({
      succes: "error",
      message: errors.array(),
    });
  }
  Patient.create(data, function (err, doc) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err,
      });
    }
    res.status(201).json({
      status: "succes",
      data: doc,
    });
  });
};

const update = async function (req, res) {
  const patientId = req.params.id;
  const errors = validationResult(req);

  const data = {
    fullname: req.body.fullname,
    phone: req.body.phone,
  };

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array(),
    });
  }

  Patient.updateOne({ _id: patientId }, { $set: data }, function (err, doc) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err,
      });
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "PATIENT_NOT_FOUND",
      });
    }

    res.json({
      success: true,
    });
  });
};

const remove = function (req, res) {
  const id = req.params.id;
  Patient.deleteOne({ _id: id }, (err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: err,
      });
    }
    res.json({
      status: "succes",
    });
  });
};

const show = async function (req, res) {
  const id = req.params.id;

  try {
    const patient = await Patient.findById(id).populate("appointments").exec();
    console.log(patient);
    res.json({
      status: "success",
      data: { ...patient._doc, appointments: patient.appointments },
    });
  } catch (error) {
    return res.status(404).json({
      succes: "error",
      message: "PATIENT_NOT_FOUND",
    });
  }
};

const all = function (req, res) {
  Patient.find({}, function (err, docs) {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: err,
      });
    }
    res.status(201).json({
      status: "succes",
      data: docs,
    });
  });
};

PatientController.prototype = {
  create,
  all,
  remove,
  update,
  show,
};

module.exports = PatientController;
