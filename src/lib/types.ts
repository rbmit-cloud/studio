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
  vehicleDetails?: VehicleDetails;
  hostName?: string;
  department?: string;
};
