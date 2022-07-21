const { validationResult } = require("express-validator");
const dayjs = require("dayjs");
const { groupBy, reduce, result } = require("lodash");
const ruLocal = require("dayjs/locale/ru");

const { Patient, Appointment } = require("../models");

const { sendSMS } = require("../utils");

function AppointmentController() {}

const create = async function (req, res) {
  const errors = validationResult(req);
  const data = {
    patient: req.body.patient,
    dentNumber: req.body.dentNumber,
    diagnosis: req.body.diagnosis,
    price: req.body.price,
    date: req.body.date,
    time: req.body.time,
  };

  if (!errors.isEmpty()) {
    return res.status(422).json({
      succes: "error",
      message: "PATIENT_NOT_FOUND",
    });
  }

  // try {
  //   const patient = await Patient.findOne({ _id: data.patient });
  // } catch (error) {
  //   return res.status(404).json({
  //     succes: "error",
  //     message: "PATIENT_NOT_FOUND",
  //   });
  // }
  const patient = await Patient.findOne({ _id: data.patient });
  Appointment.create(data, function (err, doc) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err,
      });
    }
    const delayedTime = dayjs(
      `${data.date.split(".").reverse().join(".")}T${data.time}`
    )
      .subtract(1, "minute")
      .unix();

    sendSMS({
      number: patient.phone,
      time: delayedTime,
      text: `Сегодня в ${data.time} у Вас приём в стоматологию "Granit".`,
    });

    res.status(201).json({
      success: true,
      data: doc,
    });
  });
};

const update = async function (req, res) {
  const appointmentId = req.params.id;
  const errors = validationResult(req);

  const data = {
    dentNumber: req.body.dentNumber,
    diagnosis: req.body.diagnosis,
    price: req.body.price,
    date: req.body.date,
    time: req.body.time,
  };

  if (!errors.isEmpty()) {
    return res.status(422).json({
      succes: "error",
      message: errors.array(),
    });
  }

  Appointment.updateOne(
    { _id: appointmentId },
    { $set: data },
    function (err, doc) {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: err,
        });
      }

      if (!doc) {
        return res.status(404).json({
          succes: false,
          message: "APPOINTMENT_NOT_FOUND",
        });
      }

      res.json({
        succes: true,
      });
    }
  );
};

const remove = async function (req, res) {
  const id = req.params.id;

  try {
    await Appointment.findOne({ _id: id });
  } catch (error) {
    return res.status(404).json({
      succes: "error2",
      message: "APPOINTMENT_NOT_FOUND",
    });
  }
  Appointment.deleteOne({ _id: id }, (err) => {
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

const all = function (req, res) {
  Appointment.find({})
    .populate("patient")
    .exec(function (err, docs) {
      if (err) {
        return res.status(500).json({
          status: "error1",
          message: err,
        });
      }
      res.json({
        status: "succes",
        data: reduce(
          groupBy(docs, "date"),
          (result, value, key) => {
            result = [
              ...result,
              {
                title: dayjs(key).locale(ruLocal).format("D MMMM"),
                data: value,
              },
            ];
            return result;
          },
          []
        ),
      });
    });
};

AppointmentController.prototype = {
  all,
  create,
  remove,
  update,
};

module.exports = AppointmentController;
