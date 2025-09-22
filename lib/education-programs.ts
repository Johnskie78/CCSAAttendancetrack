// Education programs data

// Basic Education grade levels
export const BASIC_EDUCATION_LEVELS = [
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
]

// Higher Education programs
export const HIGHER_EDUCATION_PROGRAMS = [
  {
    code: "BEEd",
    name: "BACHELOR OF ELEMENTARY EDUCATION",
    hasMajors: false,
  },
  {
    code: "BSNEd",
    name: "BACHELOR OF SPECIAL NEEDS EDUCATION",
    hasMajors: false,
  },
  {
    code: "BSEd",
    name: "BACHELOR OF SECONDARY EDUCATION",
    hasMajors: true,
    majors: [
      "ENGLISH",
      "FILIPINO",
      "MATHEMATICS",
      "SCIENCES",
      "SOCIAL STUDIES",
      "VALUES EDUCATION",
      "VALUES EDUCATION (Christian Theology)",
      "VALUES EDUCATION (Christian Education)",
      "VALUES EDUCATION (Christian Music)",
    ],
  },
  {
    code: "BTVTEd",
    name: "BACHELOR OF TECHNICAL-VOCATIONAL TEACHER EDUCATION",
    hasMajors: true,
    majors: ["FOOD SERVICE MANAGEMENT (FSM)"],
  },
  {
    code: "BSA",
    name: "BACHELOR OF SCIENCE IN ACCOUNTANCY",
    hasMajors: false,
  },
  {
    code: "BSBA",
    name: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
    hasMajors: true,
    majors: ["HUMAN RESOURCE MANAGEMENT (HRM)", "MARKETING MANAGEMENT (MM)", "FINANCIAL MANAGEMENT (FM)"],
  },
]

// Semesters
export const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"]

// Helper function to get program by code
export function getProgramByCode(code: string) {
  return HIGHER_EDUCATION_PROGRAMS.find((program) => program.code === code)
}

// Helper function to get all majors for a program
export function getMajorsForProgram(programCode: string) {
  const program = getProgramByCode(programCode)
  return program?.hasMajors ? program.majors : []
}

// Helper function to format program and major for display
export function formatEducationInfo(student: {
  school?: string
  program?: string
  major?: string
  semester?: string
  gradeLevel?: string
  yearLevel?: string
}) {
  if (student.school === "Basic Education") {
    return student.gradeLevel || "Not specified"
  } else {
    const program = getProgramByCode(student.program || "")
    if (!program) return student.yearLevel || "Not specified"

    let info = `${program.code}`

    if (program.hasMajors && student.major) {
      info += ` - ${student.major}`
    }

    info += ` (${student.yearLevel || "N/A"}`

    if (student.semester) {
      info += `, ${student.semester}`
    }

    info += ")"

    return info
  }
}
