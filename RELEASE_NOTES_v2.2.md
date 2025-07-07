# Release Notes - Version 2.2

Ce document répertorie toutes les améliorations, corrections de bugs et nouvelles fonctionnalités introduites dans la version 2.2 de Reminder-APP.

## Améliorations et Corrections

*   **Correction de la suppression des contrats** : Résolution d'un bug qui empêchait les administrateurs de supprimer des contrats. La fonction de suppression a été correctement implémentée sur l'interface et l'API a été créée pour gérer la suppression en base de données de manière sécurisée.
*   **Amélioration du filtrage des contrats** : Ajout d'un champ de recherche par 'Commercial' dans la page de gestion des contrats, permettant aux administrateateurs de trouver plus facilement les contrats associés à un commercial spécifique.
*   **Amélioration de l'ergonomie des filtres** : Les filtres par date dans la section des contrats ont été clarifiés et réorganisés. Ils permettent désormais de filtrer par date de début et date de fin de contrat, et sont présentés sur une seule ligne pour une meilleure lisibilité.
*   **Amélioration du formulaire d'ajout de contrat** : Lors de l'ajout de plusieurs produits à un contrat, le champ de recherche de produit est automatiquement vidé après chaque ajout, facilitant ainsi la saisie rapide de plusieurs références.
*   **Pré-remplissage de l'email de l'utilisateur** : Dans le formulaire de création de contrat, le champ de l'email pour les alertes de renouvellement est désormais automatiquement rempli avec l'adresse de l'utilisateur connecté, tout en restant modifiable.
*   **Correction du filtre de recherche client** : Résolution d'un bug dans la recherche de clients qui empêchait de trouver des noms contenant des mots partiels (ex: 'ville d' ne trouvait pas 'Ville de Fort de France'). La recherche est désormais plus intuitive.
