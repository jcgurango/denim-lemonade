import Mapper from './Mapper';

export enum EmployeeGender {
  Male = 1,
  Female = 2,
}

export enum EmployeeType {
  RegularEmployee = 1,
  Intern = 2,
  Freelancer = 3,
  AgencyWorker = 4,
  Consultant = 5,
}

export interface Employee {
  open_id: string;
  name: string;
  email?: string;
  mobile?: string;
  mobile_visible?: boolean;
  department_ids: string[];
  city?: string;
  country?: string;
  gender?: EmployeeGender;
  employee_type?: EmployeeType;
  join_time?: string;
  employee_no?: string;
  need_send_notification?: boolean;
  custom_attrs?: any;
  work_station: string;
}

export interface SourceEmployee {
  id: string;
  'Lark ID': string;
  'Full Name': string;
  'Employee ID': string;
  'Mobile Number': string;
  City: string;
  Country: string;
  Gender: 'Male' | 'Female';
}

export const EmployeeMapper = Mapper<SourceEmployee, Employee>({
  'Lark ID': 'open_id',
  'Full Name': 'name',
  'Employee ID': 'employee_no',
  'Mobile Number': 'mobile',
  Email: 'email',
  City: 'city',
  Country: 'country',
  Gender: {
    destinationColumn: 'gender',
    sourceToDestination: (source: 'Male' | 'Female') => {
      if (source === 'Male') {
        return EmployeeGender.Male;
      }

      if (source === 'Female') {
        return EmployeeGender.Female;
      }

      return null;
    },
    destinationToSource: (destination: EmployeeGender) => {
      switch (destination) {
        case EmployeeGender.Male:
          return 'Male';
        case EmployeeGender.Female:
          return 'Female';
      }
    },
  },
  id: {
    destinationColumn: 'custom_attrs',
    sourceToDestination: (source) => ({
      airtableId: source,
    }),
    destinationToSource: (destination) => destination?.airtableId,
  },
  Department: {
    destinationColumn: 'department_ids',
    sourceToDestination: (source) => (source?.id ? [source.id] : []),
    destinationToSource: (source, item) =>
      item.departments && item.departments.length
        ? {
            type: 'record',
            id: item.departments[0],
          }
        : null,
  },
});

export default EmployeeMapper;
