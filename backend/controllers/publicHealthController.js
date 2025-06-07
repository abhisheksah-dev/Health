const User = require('../models/User');
const Consultation = require('../models/Consultation');
const MedicationReminder = require('../models/MedicationReminder');
const EmergencySOS = require('../models/EmergencySOS');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get overall health statistics
exports.getHealthStats = catchAsync(async (req, res, next) => {
  const [
    userStats,
    consultationStats,
    medicationStats,
    emergencyStats
  ] = await Promise.all([
    // User demographics
    User.aggregate([
      {
        $group: {
          _id: {
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: ['$age', 18] }, then: '0-17' },
                  { case: { $lt: ['$age', 30] }, then: '18-29' },
                  { case: { $lt: ['$age', 45] }, then: '30-44' },
                  { case: { $lt: ['$age', 60] }, then: '45-59' },
                  { case: { $gte: ['$age', 60] }, then: '60+' }
                ],
                default: 'unknown'
              }
            },
            gender: '$gender'
          },
          count: { $sum: 1 }
        }
      }
    ]),

    // Consultation statistics
    Consultation.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]),

    // Medication adherence
    MedicationReminder.aggregate([
      {
        $unwind: '$logs'
      },
      {
        $group: {
          _id: {
            month: { $month: '$logs.takenAt' },
            year: { $year: '$logs.takenAt' }
          },
          totalReminders: { $sum: 1 },
          takenOnTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$logs.status', 'taken'] },
                    { $lte: [{ $abs: { $subtract: ['$logs.takenAt', '$scheduledTime'] } }, 1800000] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]),

    // Emergency SOS statistics
    EmergencySOS.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            type: '$emergencyType'
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ])
  ]);

  // Process and format the data
  const stats = {
    demographics: userStats.reduce((acc, curr) => {
      const { ageGroup, gender } = curr._id;
      if (!acc[ageGroup]) acc[ageGroup] = {};
      acc[ageGroup][gender] = curr.count;
      return acc;
    }, {}),

    consultations: consultationStats.reduce((acc, curr) => {
      const { month, year, status } = curr._id;
      const key = `${year}-${month}`;
      if (!acc[key]) acc[key] = { total: 0, byStatus: {} };
      acc[key].total += curr.count;
      acc[key].byStatus[status] = curr.count;
      acc[key].avgDuration = curr.avgDuration;
      return acc;
    }, {}),

    medicationAdherence: medicationStats.reduce((acc, curr) => {
      const { month, year } = curr._id;
      const key = `${year}-${month}`;
      acc[key] = {
        adherenceRate: (curr.takenOnTime / curr.totalReminders) * 100
      };
      return acc;
    }, {}),

    emergencies: emergencyStats.reduce((acc, curr) => {
      const { month, year, type } = curr._id;
      const key = `${year}-${month}`;
      if (!acc[key]) acc[key] = { total: 0, byType: {} };
      acc[key].total += curr.count;
      acc[key].byType[type] = curr.count;
      acc[key].avgResponseTime = curr.avgResponseTime;
      return acc;
    }, {})
  };

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

// Get disease prevalence statistics
exports.getDiseasePrevalence = catchAsync(async (req, res, next) => {
  const { startDate, endDate, region } = req.query;

  const matchStage = {
    createdAt: {
      $gte: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6)),
      $lte: endDate ? new Date(endDate) : new Date()
    }
  };

  if (region) {
    matchStage['user.location.region'] = region;
  }

  const stats = await Consultation.aggregate([
    {
      $match: matchStage
    },
    {
      $unwind: '$diagnoses'
    },
    {
      $group: {
        _id: {
          diagnosis: '$diagnoses.name',
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        count: { $sum: 1 },
        ageGroups: {
          $push: {
            $switch: {
              branches: [
                { case: { $lt: ['$user.age', 18] }, then: '0-17' },
                { case: { $lt: ['$user.age', 30] }, then: '18-29' },
                { case: { $lt: ['$user.age', 45] }, then: '30-44' },
                { case: { $lt: ['$user.age', 60] }, then: '45-59' },
                { case: { $gte: ['$user.age', 60] }, then: '60+' }
              ],
              default: 'unknown'
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.diagnosis',
        monthlyData: {
          $push: {
            month: '$_id.month',
            year: '$_id.year',
            count: '$count',
            ageDistribution: {
              $reduce: {
                input: '$ageGroups',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    { [$$this]: { $add: [{ $ifNull: [{ $arrayElemAt: ['$$value.$$this', 0] }, 0] }, 1] } }
                  ]
                }
              }
            }
          }
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      diseasePrevalence: stats
    }
  });
});

// Get regional health insights
exports.getRegionalInsights = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const matchStage = {
    createdAt: {
      $gte: startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6)),
      $lte: endDate ? new Date(endDate) : new Date()
    }
  };

  const [consultationStats, emergencyStats, medicationStats] = await Promise.all([
    // Consultation statistics by region
    Consultation.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: {
            region: '$user.location.region',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          totalConsultations: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          commonDiagnoses: {
            $push: '$diagnoses.name'
          }
        }
      },
      {
        $group: {
          _id: '$_id.region',
          monthlyData: {
            $push: {
              month: '$_id.month',
              year: '$_id.year',
              totalConsultations: '$totalConsultations',
              avgDuration: '$avgDuration',
              topDiagnoses: {
                $slice: [
                  {
                    $reduce: {
                      input: '$commonDiagnoses',
                      initialValue: {},
                      in: {
                        $mergeObjects: [
                          '$$value',
                          { [$$this]: { $add: [{ $ifNull: [{ $arrayElemAt: ['$$value.$$this', 0] }, 0] }, 1] } }
                        ]
                      }
                    }
                  },
                  5
                ]
              }
            }
          }
        }
      }
    ]),

    // Emergency statistics by region
    EmergencySOS.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: {
            region: '$location.region',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          totalEmergencies: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          emergencyTypes: {
            $push: '$emergencyType'
          }
        }
      },
      {
        $group: {
          _id: '$_id.region',
          monthlyData: {
            $push: {
              month: '$_id.month',
              year: '$_id.year',
              totalEmergencies: '$totalEmergencies',
              avgResponseTime: '$avgResponseTime',
              emergencyTypeDistribution: {
                $reduce: {
                  input: '$emergencyTypes',
                  initialValue: {},
                  in: {
                    $mergeObjects: [
                      '$$value',
                      { [$$this]: { $add: [{ $ifNull: [{ $arrayElemAt: ['$$value.$$this', 0] }, 0] }, 1] } }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    ]),

    // Medication adherence by region
    MedicationReminder.aggregate([
      {
        $match: matchStage
      },
      {
        $unwind: '$logs'
      },
      {
        $group: {
          _id: {
            region: '$user.location.region',
            month: { $month: '$logs.takenAt' },
            year: { $year: '$logs.takenAt' }
          },
          totalReminders: { $sum: 1 },
          takenOnTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$logs.status', 'taken'] },
                    { $lte: [{ $abs: { $subtract: ['$logs.takenAt', '$scheduledTime'] } }, 1800000] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.region',
          monthlyData: {
            $push: {
              month: '$_id.month',
              year: '$_id.year',
              adherenceRate: {
                $multiply: [
                  { $divide: ['$takenOnTime', '$totalReminders'] },
                  100
                ]
              }
            }
          }
        }
      }
    ])
  ]);

  // Combine and format the data
  const regionalInsights = consultationStats.map(region => {
    const emergencyData = emergencyStats.find(e => e._id === region._id);
    const medicationData = medicationStats.find(m => m._id === region._id);

    return {
      region: region._id,
      insights: region.monthlyData.map(monthData => {
        const emergencyMonthData = emergencyData?.monthlyData.find(
          e => e.month === monthData.month && e.year === monthData.year
        );
        const medicationMonthData = medicationData?.monthlyData.find(
          m => m.month === monthData.month && m.year === monthData.year
        );

        return {
          month: monthData.month,
          year: monthData.year,
          consultations: {
            total: monthData.totalConsultations,
            avgDuration: monthData.avgDuration,
            topDiagnoses: monthData.topDiagnoses
          },
          emergencies: emergencyMonthData ? {
            total: emergencyMonthData.totalEmergencies,
            avgResponseTime: emergencyMonthData.avgResponseTime,
            typeDistribution: emergencyMonthData.emergencyTypeDistribution
          } : null,
          medicationAdherence: medicationMonthData ? {
            adherenceRate: medicationMonthData.adherenceRate
          } : null
        };
      })
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      regionalInsights
    }
  });
}); 