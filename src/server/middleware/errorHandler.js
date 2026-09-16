import { config } from '../config.js';

export function errorHandler(err, req, res, next) {
  console.error('❌ Erreur Serveur:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux (taille maximale autorisée : 5 Mo).'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'envoi de fichier : ${err.message}`
    });
  }

  const statusCode = err.status || 500;
  const response = {
    success: false,
    message: err.message || 'Une erreur interne est survenue. Veuillez réessayer plus tard.'
  };

  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
