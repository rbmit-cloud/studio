import * as React from 'react';

interface EmailTemplateProps {
  hostName: string;
  reportTitle: string;
}

const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  hostName,
  reportTitle
}) => (
  <div>
    <h1>{reportTitle}</h1>
    <p>Hola {hostName},</p>
    <p>Adjunto encontrarás el informe de visitas solicitado.</p>
    <p>Saludos cordiales,</p>
    <p>Sistema de Registro de Visitas</p>
  </div>
);

export default EmailTemplate;
