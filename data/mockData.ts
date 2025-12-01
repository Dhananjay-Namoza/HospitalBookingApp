export const mockUsers = [
  // Patients
  {
    id: 1,
    email: 'patient@test.com',
    password: '123456',
    type: 'patient' as const,
    name: 'John Doe',
    phone: '+91 9876543210',
    isPremium: true,
    allergies: ['Penicillin', 'Shellfish', 'Pollen'],
    diseases: ['Diabetes Type 2', 'Hypertension'],
    bloodGroup: 'O+',
    emergencyContact: '+91 9876543211',
    address: '123 Main Street, Mumbai, Maharashtra',
    dateOfBirth: '1985-06-15',
    gender: 'Male'
  },
  {
    id: 2,
    email: 'patient2@test.com',
    password: '123456',
    type: 'patient' as const,
    name: 'Jane Smith',
    phone: '+91 9876543212',
    isPremium: false,
    allergies: ['Peanuts', 'Dust'],
    diseases: ['Asthma'],
    bloodGroup: 'A+',
    emergencyContact: '+91 9876543213',
    address: '456 Park Avenue, Delhi, Delhi',
    dateOfBirth: '1990-03-22',
    gender: 'Female'
  },
  {
    id: 3,
    email: 'patient3@test.com',
    password: '123456',
    type: 'patient' as const,
    name: 'Michael Johnson',
    phone: '+91 9876543214',
    isPremium: true,
    allergies: ['Latex'],
    diseases: ['High Cholesterol'],
    bloodGroup: 'B-',
    emergencyContact: '+91 9876543215',
    address: '789 Oak Street, Bangalore, Karnataka',
    dateOfBirth: '1978-11-08',
    gender: 'Male'
  },
  // Doctors
  {
    id: 101,
    email: 'doctor@test.com',
    password: '123456',
    type: 'doctor' as const,
    designation: 'Senior Consultant',
    category: 'Cardiologist',
    name: 'Dr. Sarah Johnson',
    phone: '+91 9876543220',
    speciality: 'Cardiology',
    experience: 12,
    qualification: 'MBBS, MD - Cardiology, DM - Interventional Cardiology',
    hospitalName: 'City Heart Hospital',
    address: 'Cardiology Wing, City Heart Hospital, Mumbai'
  },
  {
    id: 102,
    email: 'doctor2@test.com',
    password: '123456',
    type: 'doctor' as const,
    designation: 'Consultant',
    category: 'Neurologist',
    name: 'Dr. Michael Chen',
    phone: '+91 9876543221',
    speciality: 'Neurology',
    experience: 8,
    qualification: 'MBBS, MD - Neurology, DM - Clinical Neurophysiology',
    hospitalName: 'NeuroScience Center',
    address: 'Neurology Department, NeuroScience Center, Delhi'
  },
  {
    id: 103,
    email: 'doctor3@test.com',
    password: '123456',
    type: 'doctor' as const,
    designation: 'Senior Consultant',
    category: 'Pediatrician',
    name: 'Dr. Priya Sharma',
    phone: '+91 9876543222',
    speciality: 'Pediatrics',
    experience: 15,
    qualification: 'MBBS, MD - Pediatrics, Fellowship in Pediatric Cardiology',
    hospitalName: 'Children\'s Medical Center',
    address: 'Pediatrics Wing, Children\'s Medical Center, Bangalore'
  }
];

export const mockDoctors = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    speciality: 'Cardiologist',
    rating: 4.8,
    reviews: 150,
    experience: 12,
    consultationFee: 800,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
    qualifications: ['MBBS', 'MD - Cardiology', 'DM - Interventional Cardiology'],
    about: 'Dr. Sarah Johnson is a renowned cardiologist with over 12 years of experience in treating complex cardiac conditions. She specializes in interventional cardiology and has performed over 1000 successful procedures. She is known for her compassionate care and cutting-edge treatment approaches.',
    hospitalName: 'City Heart Hospital',
    address: 'Cardiology Wing, City Heart Hospital, Mumbai',
    languages: ['English', 'Hindi', 'Marathi'],
    awards: ['Best Cardiologist Award 2023', 'Excellence in Patient Care 2022'],
    availableSlots: {
      '2024-01-15': ['09:00', '10:00', '11:00', '14:00', '15:00'],
      '2024-01-16': ['09:30', '10:30', '11:30', '14:30', '15:30'],
      '2024-01-17': ['09:00', '10:00', '11:00', '14:00', '15:00'],
      '2024-01-18': ['09:30', '10:30', '11:30', '14:30'],
      '2024-01-19': ['09:00', '10:00', '14:00', '15:00', '16:00'],
      '2024-01-22': ['09:00', '10:00', '11:00', '14:00', '15:00']
    }
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    speciality: 'Neurologist',
    rating: 4.7,
    reviews: 120,
    experience: 8,
    consultationFee: 700,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
    qualifications: ['MBBS', 'MD - Neurology', 'DM - Clinical Neurophysiology'],
    about: 'Dr. Michael Chen specializes in treating neurological disorders including epilepsy, stroke, and neurodegenerative diseases. He is known for his patient-centered approach and expertise in advanced neurological treatments.',
    hospitalName: 'NeuroScience Center',
    address: 'Neurology Department, NeuroScience Center, Delhi',
    languages: ['English', 'Hindi', 'Chinese'],
    awards: ['Young Neurologist Award 2021', 'Research Excellence Award 2020'],
    availableSlots: {
      '2024-01-15': ['09:30', '10:30', '11:30', '14:30'],
      '2024-01-16': ['09:00', '10:00', '11:00', '14:00', '15:00'],
      '2024-01-17': ['09:30', '10:30', '11:30', '14:30', '15:30'],
      '2024-01-18': ['09:00', '10:00', '11:00', '14:00'],
      '2024-01-19': ['09:30', '10:30', '14:30', '15:30'],
      '2024-01-22': ['09:00', '10:00', '11:00', '14:00', '15:00']
    }
  },
  {
    id: 3,
    name: 'Dr. Priya Sharma',
    speciality: 'Pediatrician',
    rating: 4.9,
    reviews: 200,
    experience: 15,
    consultationFee: 600,
    image: 'https://images.unsplash.com/photo-1594824092813-b3f99c57e8e7?w=200&h=200&fit=crop&crop=face',
    qualifications: ['MBBS', 'MD - Pediatrics', 'Fellowship in Pediatric Cardiology'],
    about: 'Dr. Priya Sharma has extensive experience in pediatric care and is known for her gentle approach with children. She specializes in pediatric cardiology and developmental disorders, making her a trusted choice for parents.',
    hospitalName: 'Children\'s Medical Center',
    address: 'Pediatrics Wing, Children\'s Medical Center, Bangalore',
    languages: ['English', 'Hindi', 'Kannada'],
    awards: ['Pediatrician of the Year 2023', 'Child Care Excellence Award 2022'],
    availableSlots: {
      '2024-01-15': ['10:00', '11:00', '15:00', '16:00'],
      '2024-01-16': ['09:00', '10:00', '11:00', '15:00', '16:00'],
      '2024-01-17': ['10:00', '11:00', '14:00', '15:00'],
      '2024-01-18': ['09:00', '10:00', '15:00', '16:00'],
      '2024-01-19': ['09:00', '11:00', '14:00', '15:00'],
      '2024-01-22': ['10:00', '11:00', '15:00', '16:00']
    }
  }
];

export const mockChats = [
  {
    id: 1,
    type: 'doctor',
    doctorId: 1,
    patientId: 1,
    name: 'Dr. Sarah Johnson',
    lastMessage: 'Please take your medications on time and avoid strenuous activities.',
    timestamp: '2024-01-14T15:30:00Z',
    unread: 2,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face'
  },
  {
    id: 2,
    type: 'reception',
    name: 'Hospital Reception',
    lastMessage: 'Your appointment with Dr. Johnson is confirmed for tomorrow at 10:00 AM.',
    timestamp: '2024-01-14T10:00:00Z',
    unread: 0,
    avatar: null
  },
  {
    id: 3,
    type: 'doctor',
    doctorId: 2,
    patientId: 2,
    name: 'Dr. Michael Chen',
    lastMessage: 'How are you feeling after the new medication?',
    timestamp: '2024-01-13T16:45:00Z',
    unread: 1,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'
  }
];

export const mockMessages = {
  1: [
    {
      id: 1,
      senderId: 101,
      senderType: 'doctor',
      message: 'Hello John! How are you feeling today?',
      timestamp: '2024-01-14T14:30:00Z'
    },
    {
      id: 2,
      senderId: 1,
      senderType: 'patient',
      message: 'Hi Doctor, I am feeling much better after taking the prescribed medications.',
      timestamp: '2024-01-14T14:35:00Z'
    },
    {
      id: 3,
      senderId: 101,
      senderType: 'doctor',
      message: 'That\'s great to hear! Please continue with the medications and avoid strenuous activities.',
      timestamp: '2024-01-14T15:30:00Z'
    },
    {
      id: 4,
      senderId: 1,
      senderType: 'patient',
      message: 'Sure doctor. Should I continue the same diet plan?',
      timestamp: '2024-01-14T15:35:00Z'
    }
  ],
  2: [
    {
      id: 5,
      senderId: 'reception',
      senderType: 'reception',
      message: 'Hello! How can I help you today?',
      timestamp: '2024-01-14T09:00:00Z'
    },
    {
      id: 6,
      senderId: 1,
      senderType: 'patient',
      message: 'I would like to reschedule my appointment.',
      timestamp: '2024-01-14T09:30:00Z'
    },
    {
      id: 7,
      senderId: 'reception',
      senderType: 'reception',
      message: 'Your appointment with Dr. Johnson is confirmed for tomorrow at 10:00 AM.',
      timestamp: '2024-01-14T10:00:00Z'
    }
  ],
  3: [
    {
      id: 8,
      senderId: 102,
      senderType: 'doctor',
      message: 'Hello Jane! How are the headaches now?',
      timestamp: '2024-01-13T16:00:00Z'
    },
    {
      id: 9,
      senderId: 2,
      senderType: 'patient',
      message: 'They\'ve reduced significantly, thank you!',
      timestamp: '2024-01-13T16:30:00Z'
    },
    {
      id: 10,
      senderId: 102,
      senderType: 'doctor',
      message: 'How are you feeling after the new medication?',
      timestamp: '2024-01-13T16:45:00Z'
    }
  ]
};

export const mockReviews = {
  1: [
    {
      id: 1,
      patientName: 'Anonymous Patient',
      rating: 5,
      comment: 'Excellent doctor! Very professional and caring. Explained everything clearly.',
      date: '2024-01-10',
      patientId: 1
    },
    {
      id: 2,
      patientName: 'A. Kumar',
      rating: 4,
      comment: 'Good experience overall. Treatment was effective.',
      date: '2024-01-08',
      patientId: 2
    },
    {
      id: 3,
      patientName: 'M. Singh',
      rating: 5,
      comment: 'Dr. Johnson is amazing! She saved my life with her expertise.',
      date: '2024-01-05',
      patientId: 3
    }
  ],
  2: [
    {
      id: 4,
      patientName: 'P. Patel',
      rating: 5,
      comment: 'Very knowledgeable doctor. Helped me understand my condition better.',
      date: '2024-01-09',
      patientId: 1
    },
    {
      id: 5,
      patientName: 'S. Sharma',
      rating: 4,
      comment: 'Professional and thorough examination. Recommended.',
      date: '2024-01-07',
      patientId: 2
    }
  ],
  3: [
    {
      id: 6,
      patientName: 'R. Gupta',
      rating: 5,
      comment: 'Wonderful with children! My kid loves visiting Dr. Priya.',
      date: '2024-01-11',
      patientId: 3
    }
  ]
};

export const mockMedicalRecords = {
  1: {
    prescriptions: [
      {
        id: 1,
        doctorId: 1,
        doctorName: 'Dr. Sarah Johnson',
        date: '2024-01-10',
        medications: [
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days' }
        ],
        instructions: 'Take with food. Monitor blood pressure daily.'
      }
    ],
    testReports: [
      {
        id: 1,
        testName: 'Blood Sugar Test',
        date: '2024-01-10',
        result: 'Normal',
        values: { fasting: '95 mg/dL', postprandial: '140 mg/dL' }
      },
      {
        id: 2,
        testName: 'ECG',
        date: '2024-01-10',
        result: 'Normal',
        values: { heartRate: '75 bpm', rhythm: 'Regular' }
      }
    ],
    vitalSigns: [
      {
        date: '2024-01-10',
        bloodPressure: '120/80',
        heartRate: 75,
        temperature: 98.6,
        weight: 75,
        height: 175
      }
    ]
  }
};
// Enhanced Doctor Availability Data
export const mockDoctorAvailability = {
  101: { // Dr. Sarah Wilson
    unavailableDates: ['2024-12-20', '2024-12-25', '2024-12-26'],
    unavailablePeriods: [
      {
        date: '2024-12-18',
        startTime: '14:00',
        endTime: '16:00',
        reason: 'Emergency surgery'
      },
      {
        date: '2024-12-19',
        startTime: '10:00',
        endTime: '12:00',
        reason: 'Medical conference'
      }
    ],
    workingHours: {
      monday: { start: '09:00', end: '18:00', slots: 30 },
      tuesday: { start: '09:00', end: '18:00', slots: 30 },
      wednesday: { start: '09:00', end: '18:00', slots: 30 },
      thursday: { start: '09:00', end: '18:00', slots: 30 },
      friday: { start: '09:00', end: '17:00', slots: 30 },
      saturday: { start: '10:00', end: '14:00', slots: 30 },
      sunday: { available: false }
    },
    timeSlots: generateTimeSlots(),
    consultationFee: 500
  },
  102: { // Dr. Michael Chen
    unavailableDates: ['2024-12-21'],
    unavailablePeriods: [
      {
        date: '2024-12-17',
        startTime: '15:00',
        endTime: '18:00',
        reason: 'Personal appointment'
      }
    ],
    workingHours: {
      monday: { start: '10:00', end: '19:00', slots: 45 },
      tuesday: { start: '10:00', end: '19:00', slots: 45 },
      wednesday: { start: '10:00', end: '19:00', slots: 45 },
      thursday: { start: '10:00', end: '19:00', slots: 45 },
      friday: { start: '10:00', end: '18:00', slots: 45 },
      saturday: { start: '09:00', end: '13:00', slots: 45 },
      sunday: { available: false }
    },
    timeSlots: generateTimeSlots(45),
    consultationFee: 800
  }
};

function generateTimeSlots(duration = 30) {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      if (hour < 18 || (hour === 18 && minute === 0)) {
        slots.push(time);
      }
    }
  }
  return slots;
}

// Enhanced Appointments Data
export const mockAppointments = [
  {
    id: 1,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 101,
    doctorName: 'Dr. Sarah Wilson',
    date: '2024-12-17',
    time: '10:00',
    endTime: '10:30',
    type: 'Consultation',
    status: 'upcoming',
    fee: 500,
    symptoms: 'Chest pain and difficulty breathing',
    notes: 'Follow-up required in 1 week',
    bookingTime: '2024-12-15T09:30:00Z',
    isRescheduled: false,
    originalDate: null,
    rescheduledBy: null
  },
  {
    id: 2,
    patientId: 2,
    patientName: 'Jane Smith',
    doctorId: 102,
    doctorName: 'Dr. Michael Chen',
    date: '2024-12-18',
    time: '14:00',
    endTime: '14:45',
    type: 'Follow-up',
    status: 'upcoming',
    fee: 800,
    symptoms: 'Diabetes check-up',
    notes: 'Blood sugar levels monitoring',
    bookingTime: '2024-12-16T14:20:00Z',
    isRescheduled: false,
    originalDate: null,
    rescheduledBy: null
  },
  {
    id: 3,
    patientId: 1,
    patientName: 'John Doe',
    doctorId: 101,
    doctorName: 'Dr. Sarah Wilson',
    date: '2024-12-10',
    time: '15:00',
    endTime: '15:30',
    type: 'Consultation',
    status: 'completed',
    fee: 500,
    symptoms: 'Regular check-up',
    notes: 'Patient is healthy, next check-up in 6 months',
    bookingTime: '2024-12-08T11:00:00Z',
    isRescheduled: false,
    originalDate: null,
    rescheduledBy: null
  }
];

// Reception Users Data
export const mockReceptionUsers = [
  {
    id: 201,
    name: 'Reception Admin',
    email: 'reception@hospital.com',
    phone: '+1-555-0199',
    type: 'reception',
    hospitalId: 1,
    permissions: ['reschedule', 'cancel', 'view_all', 'manage_slots']
  }
];

// Doctor Unavailability Messages to Reception
export const mockUnavailabilityMessages = [
  {
    id: 1,
    doctorId: 101,
    doctorName: 'Dr. Sarah Wilson',
    date: '2024-12-20',
    type: 'full_day',
    reason: 'Medical emergency',
    affectedAppointments: [4, 5, 6],
    status: 'pending',
    createdAt: '2024-12-19T08:00:00Z',
    message: 'Unable to attend appointments due to medical emergency. Please reschedule all appointments for December 20th.'
  },
  {
    id: 2,
    doctorId: 102,
    doctorName: 'Dr. Michael Chen',
    date: '2024-12-21',
    type: 'partial',
    startTime: '14:00',
    endTime: '18:00',
    reason: 'Family emergency',
    affectedAppointments: [7, 8],
    status: 'pending',
    createdAt: '2024-12-20T10:30:00Z',
    message: 'Family emergency requires immediate attention. Cannot attend afternoon appointments.'
  }
];
