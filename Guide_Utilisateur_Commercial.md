# Guide Utilisateur - Reminder-APP (Profil Commercial)

---

## Introduction

### Bienvenue sur Reminder-APP !

Ce guide est conçu pour vous, membres de l'équipe commerciale, afin de vous aider à maîtriser rapidement et efficacement notre outil de gestion des contrats et des rappels.

L'objectif de cette application est de simplifier et d'automatiser le suivi des contrats clients, de leurs produits associés et des échéances importantes. Grâce à cet outil, vous pourrez :

- Centraliser toutes les informations sur vos clients et leurs contrats.
- Gérer un catalogue de produits clair et précis.
- Créer des comptes d'accès pour vos clients (souscripteurs) afin qu'ils puissent consulter leurs propres contrats.
- Ne plus jamais manquer une échéance de renouvellement.

Ce document vous guidera pas à pas à travers chaque fonctionnalité clé.

---

## Chapitre 1 : Premiers Pas

### 1.1. Accéder à l'application et se connecter

Pour commencer, vous devez vous connecter à votre compte commercial.

**Instructions :**

1.  Ouvrez votre navigateur web et rendez-vous à l'adresse de l'application : `[URL de votre application]`.
2.  Vous arriverez sur la page de connexion. Entrez votre adresse e-mail et votre mot de passe dans les champs prévus à cet effet.

    * **[ACTION : Insérer ici une capture d'écran de la page de connexion `signin.js` avec des flèches sur les champs 'Email' et 'Mot de passe'.]**

3.  Cliquez sur le bouton **"Se connecter"**.

    * **[ACTION : Insérer ici une capture d'écran avec une flèche sur le bouton "Se connecter".]**

### 1.2. Découverte du Tableau de Bord

Une fois connecté, vous arriverez sur le tableau de bord principal. C'est votre centre de contrôle.

Il est divisé en plusieurs sections principales, accessibles via les onglets en haut de la page :

- **Clients :** Pour gérer la liste de tous vos clients.
- **Produits :** Pour gérer le catalogue des produits que vous vendez.
- **Contrats :** Pour créer et suivre tous les contrats actifs.
- **Souscripteurs :** Pour créer et gérer les accès de vos clients à leur portail personnel.

    * **[ACTION : Insérer ici une capture d'écran complète de la page d'accueil `/admin` après connexion, en encadrant les différents onglets (Clients, Produits, Contrats, Souscripteurs). ]**

---

## Chapitre 2 : Gérer les Clients

La création d'un client est la première étape indispensable avant de pouvoir créer un contrat. Chaque contrat doit obligatoirement être rattaché à un client existant.

### 2.1. Créer un nouveau client

**Instructions :**

1.  Depuis le tableau de bord, cliquez sur l'onglet **"Clients"**.

    * **[ACTION : Insérer ici une capture d'écran du tableau de bord avec une flèche sur l'onglet "Clients".]**

2.  Sur la page des clients, cliquez sur le bouton **"+ Ajouter un client"** situé en haut à droite.

    * **[ACTION : Insérer ici une capture d'écran de la liste des clients avec une flèche sur le bouton "+ Ajouter un client".]**

3.  Un champ de saisie apparaît. Entrez le nom complet et unique de votre nouveau client.

    * **[ACTION : Insérer ici une capture d'écran du champ de saisie avec un exemple de nom de client.]**

4.  Cliquez sur le bouton **"Sauvegarder"** pour confirmer. Le nouveau client apparaîtra instantanément dans la liste.

**Conseil :** Le nom de chaque client doit être unique. Si vous essayez d'entrer un nom qui existe déjà, le système vous en informera.

### 2.2. Consulter ou Modifier un client

Pour l'instant, la seule information modifiable est le nom du client.

**Instructions :**

1.  Dans la liste des clients, trouvez le client que vous souhaitez modifier.
2.  Cliquez sur l'icône en forme de crayon à droite de la ligne du client.

    * **[ACTION : Insérer ici une capture d'écran montrant une ligne de client avec une flèche sur l'icône de modification.]**

3.  Modifiez le nom dans le champ qui s'affiche et cliquez sur **"Sauvegarder"**.

---

## Chapitre 3 : Gérer le Catalogue Produits

Le catalogue produits vous permet de définir tous les services ou articles que vous facturez à travers les contrats. Chaque produit est défini par une référence unique et une description.

### 3.1. Ajouter un nouveau produit

**Instructions :**

1.  Depuis le tableau de bord, cliquez sur l'onglet **"Produits"**.

    * **[ACTION : Insérer ici une capture d'écran du tableau de bord avec une flèche sur l'onglet "Produits".]**

2.  Cliquez sur le bouton **"+ Ajouter un produit"** en haut à droite.

    * **[ACTION : Insérer ici une capture d'écran de la liste des produits avec une flèche sur le bouton "+ Ajouter un produit".]**

3.  Remplissez les deux champs du formulaire :
    - **Référence :** Un code unique pour identifier le produit (ex: `SERV-MAINT-01`).
    - **Description :** Une description claire de ce qu'est le produit (ex: `Service de maintenance annuel - Standard`).

    * **[ACTION : Insérer ici une capture d'écran du formulaire de création de produit rempli.]**

4.  Cliquez sur **"Sauvegarder"**. Le produit est maintenant disponible pour être ajouté à des contrats.

### 3.2. Modifier un produit

**Instructions :**

1.  Dans la liste des produits, trouvez celui que vous souhaitez modifier et cliquez sur l'icône en forme de crayon.

    * **[ACTION : Insérer ici une capture d'écran montrant une ligne de produit avec une flèche sur l'icône de modification.]**

2.  Modifiez la référence ou la description dans le formulaire et cliquez sur **"Sauvegarder"**.

---

## Chapitre 4 : Créer et Gérer les Contrats

C'est ici que tout se met en place. La création d'un contrat lie un client, un ou plusieurs produits, et des conditions spécifiques (durée, dates, etc.).

### 4.1. Créer un nouveau contrat

**Instructions :**

1.  Depuis le tableau de bord, cliquez sur l'onglet **"Contrats"**.

    * **[ACTION : Insérer ici une capture d'écran du tableau de bord avec une flèche sur l'onglet "Contrats".]**

2.  Cliquez sur le bouton **"+ Ajouter un contrat"** en haut à droite pour ouvrir le formulaire de création.

    * **[ACTION : Insérer ici une capture d'écran de la liste des contrats avec une flèche sur le bouton "+ Ajouter un contrat".]**

3.  **Remplissez le formulaire de contrat étape par étape :**

    a. **Sélectionner un Client :** Cliquez sur le menu déroulant et choisissez le client concerné par le contrat. Vous pouvez taper les premières lettres pour filtrer la liste.

       * **[ACTION : Insérer une capture d'écran du formulaire montrant le menu déroulant des clients.]**

    b. **Ajouter des Produits :**
       - Sélectionnez un produit dans la liste déroulante.
       - Indiquez la `Quantité`.
       - Cliquez sur **"Ajouter un produit"**. Le produit apparaît dans un tableau récapitulatif juste en dessous. Répétez l'opération pour tous les produits du contrat.

       * **[ACTION : Insérer une capture d'écran montrant la section d'ajout de produit avec un produit sélectionné et une quantité.]**

    c. **Définir les Dates et la Durée :**
       - **Date de début :** La date de départ du contrat.
       - **Durée (en mois) :** La durée totale du contrat en nombre de mois.
       - **Email (optionnel) :** Une adresse e-mail spécifique pour les notifications de ce contrat.

       * **[ACTION : Insérer une capture d'écran de la section des dates et de la durée.]**

    d. **Ajouter un Commentaire (optionnel) :**
       - Utilisez ce champ pour ajouter toute information pertinente qui n'a pas sa place ailleurs (ex: "Remise spéciale accordée par M. Dupont", "Installation prévue le 15/08"). Ce commentaire est searchable !

       * **[ACTION : Insérer une capture d'écran du champ commentaire.]**

4.  Une fois tous les champs remplis, cliquez sur **"Sauvegarder le contrat"** en bas du formulaire.

### 4.2. Retrouver et Filtrer les contrats

La liste des contrats peut devenir longue. Utilisez les filtres pour retrouver rapidement l'information dont vous avez besoin.

- **Filtres disponibles :** Par nom de Client, par Référence de produit, par date de fin de contrat, et par **Commentaire**.

    * **[ACTION : Insérer une capture d'écran de la zone de filtres au-dessus de la liste des contrats, en mettant en évidence le nouveau champ de recherche par commentaire.]**

---

## Chapitre 5 : Gérer les Souscripteurs

La fonctionnalité "Souscripteur" permet de créer un accès direct pour vos clients. Un souscripteur pourra se connecter à l'application et voir la liste de ses propres contrats, mais ne pourra rien modifier.

### 5.1. Créer un compte Souscripteur

**Instructions :**

1.  Depuis le tableau de bord, cliquez sur l'onglet **"Souscripteurs"**.

    * **[ACTION : Insérer ici une capture d'écran du tableau de bord avec une flèche sur l'onglet "Souscripteurs".]**

2.  Cliquez sur le bouton **"+ Créer un souscripteur"**.

    * **[ACTION : Insérer ici une capture d'écran de la liste des souscripteurs avec une flèche sur le bouton de création.]**

3.  **Remplissez le formulaire de création :**

    a. **Nom du souscripteur :** Le nom de la personne qui utilisera le compte.

    b. **Email :** L'adresse e-mail qui servira d'identifiant de connexion. Elle doit être unique.

    c. **Mot de passe :** Définissez un mot de passe temporaire pour le client. Il est recommandé de lui communiquer de manière sécurisée.

    d. **Client associé :** C'est l'étape la plus importante. Sélectionnez dans la liste le client auquel ce compte souscripteur sera rattaché. Le souscripteur ne verra que les contrats de ce client.

    * **[ACTION : Insérer une capture d'écran du formulaire de création de souscripteur entièrement rempli.]**

4.  Cliquez sur **"Créer"**. Le compte est maintenant actif.

---

## Conclusion

Félicitations ! Vous avez maintenant toutes les clés en main pour gérer efficacement vos activités commerciales sur Reminder-APP. N'hésitez pas à explorer l'application et à vous familiariser avec les différentes sections.

Pour toute question technique ou problème, veuillez contacter le support administrateur.
