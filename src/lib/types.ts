export type VehicleDetails = {
  type: string;
  licensePlate: string;
  trailerLicensePlate?: string;
};

export type Visitor = {
  id: string;
  visitorName: string;
  companyName: string;
  clientCompany?: string;
  purposeOfVisit: string;
  entryType: 'Transportista' | 'Personal';
  entryDateTime: string;
  exitDateTime?: string;
  vehicleDetails?: VehicleDetails;
  hostName?: string;
  department?: string;
};

export type Host = {
  id: string;
  name: string;
  department: string;
  email: string;
};
