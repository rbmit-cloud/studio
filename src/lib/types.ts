export type VehicleDetails = {
  type: string;
  licensePlate: string;
};

export type Visitor = {
  id: string;
  visitorName: string;
  companyName: string;
  purposeOfVisit: string;
  entryType: 'Transportista' | 'Personal';
  entryDateTime: string;
  vehicleDetails?: VehicleDetails;
  hostName?: string;
};
