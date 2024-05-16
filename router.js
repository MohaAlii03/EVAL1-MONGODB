import { Router } from  "express";
import {Balade} from "./model.js"

const router = Router();

router.get('/', (req, rep) => {
    rep.json("Bonjour");
})

// Route 1:
router.get('/all', async (req, res) => {
    try {
        const balades = await Balade.find();
        res.json(balades);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des balades.' });
    }
});

// Route 2:
router.get('/id/:id', async (req, res) => {
    try {
        const balade = await Balade.findById(req.params.id);
        if (!balade) {
            return res.status(404).json({ error: 'Balade non trouvée.' });
        }
        res.json(balade);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de la balade.' });
    }
});

// Route 3:
router.get('/search/:search', async (req, res) => {
    try {
        const searchTerm = req.params.search.toLowerCase();

        const matchingBalades = await Balade.find({
            $or: [
                { nom_poi: { $regex: searchTerm, $options: 'i' } }, 
                { texte_intro: { $regex: searchTerm, $options: 'i' } } 
            ]
        });

        if (matchingBalades.length === 0) {
            return res.status(404).json({ message: 'Aucune balade correspondante trouvée.' });
        }

        res.json(matchingBalades);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la recherche des balades.' });
    }
});

// Route 4
router.get('/site-internet', async (req, res) => {
    try {
        const baladesWithWebsite = await Balade.find({ url_site: { $ne: null } });

        if (baladesWithWebsite.length === 0) {
            return res.status(404).json({ message: 'Aucune balade avec site internet trouvé.' });
        }

        res.json(baladesWithWebsite);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des balades avec site internet.' });
    }
});

// Route 5
router.get('/mot-cle', async (req, res) => {
    try {
        const baladesWithMultipleKeywords = await Balade.find({
            mot_cle: { $exists: true, $ne: null },
            $expr: { $gt: [{ $size: "$mot_cle" }, 5] }
        });

        if (baladesWithMultipleKeywords.length === 0) {
            return res.status(404).json({ message: 'Aucune balade avec plus de 5 mots-clés trouvé.' });
        }

        res.json(baladesWithMultipleKeywords);
    } catch (error) {
        console.error('Erreur MongoDB :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des balades avec plus de 5 mots-clés.' });
    }
});

// Route 6
router.get ("/publie/:annee", async function(req, rep){

    const year = req.params.annee;

const reponse = await Balade.find({
    date_saisie: { $regex: year, $options: 'i' }
}).sort({ date_saisie: 1 })

    rep.json(reponse)
});

//Route7
router.get('/arrondissement/:num_arrondissement', async (req, res) => {
    try {
        const numArrondissement = req.params.num_arrondissement; 

        
        const countBalades = await Balade.countDocuments({ code_postal: numArrondissement });

        res.json({ count: countBalades }); 
    } catch (error) {
        console.error('Erreur MongoDB :', error);
        res.status(500).json({ error: `Erreur lors du comptage des balades pour l'arrondissement ${numArrondissement}.` });
    }
});

//Route8
router.get('/synthese', async (req, res) => {
    try {
        // Utilisation de la méthode aggregate de Mongoose pour regrouper et compter les balades par arrondissement
        const syntheseBalades = await Balade.aggregate([
            { 
                $group: { 
                    _id: '$code_postal',  // Regrouper par numéro d'arrondissement (code postal)
                    count: { $sum: 1 }     // Compter le nombre de balades par arrondissement
                } 
            }
        ]);

        // Créer un objet pour stocker les résultats par arrondissement
        const syntheseParArrondissement = {};
        syntheseBalades.forEach((item) => {
            syntheseParArrondissement[item._id] = item.count;
        });

        res.json(syntheseParArrondissement); // Renvoyer les résultats sous forme de réponse JSON
    } catch (error) {
        console.error('Erreur MongoDB :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du résumé par arrondissement.' });
    }
});

//route9
router.get('/categories', async (req, res) => {
    try {
        // Utilisation de la méthode distinct de Mongoose pour récupérer les catégories uniques
        const categories = await Balade.distinct('categorie');

        res.json(categories); // Renvoyer les catégories uniques sous forme de réponse JSON
    } catch (error) {
        console.error('Erreur MongoDB :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des catégories de balades.' });
    }
});

//Route10
router.post("/add", async function(req, rep){
    const balades = req.body ; // l'objet va être envoyé dans la requete 
    if (!balades.nom_poi,  !balades.adresse,  !balades.categorie) {
        return rep.status(400).json({ message: "Les champs 'nom_poi', 'adresse' et 'categorie' sont obligatoires." });
    };

    const nouvelBalade = new Balade(balades);
    try{
        const reponse = await nouvelBalade.save();// insertOne()
        rep.json(reponse); 
    } catch (err) {
        console.log(error)
        rep.status(500).json({ message : err.message });
    }
});

//ROute11
router.put('/add-mot-cle/:id', async (req, rep) => {
    try {
        const { id } = req.params;
        const { mot_cle } = req.body;

        if (!mot_cle) {
            return rep.status(400).json({ error: 'Le mot clé est obligatoire.' });
        }

        const balade = await Balade.findById(id);

        if (!balade) {
            return rep.status(404).json({ error: 'Balade non trouvée.' });
        }

        if (balade.mot_cle.includes(mot_cle)) {
            return rep.status(400).json({ error: 'Le mot clé existe déjà.' });
        }

        balade.mot_cle.push(mot_cle);
        await balade.save();

        rep.status(200).json(balade);
    } catch (error) {
        console.log(error);
        rep.status(500).json({ error: 'Erreur lors de l\'ajout du mot clé.' });
    }
});

//Route12
router.put('/update-one/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const miseAJour = req.body;

        const balade = await Balade.findByIdAndUpdate(id, miseAJour, { new: true });

        if (!balade) {
            return res.status(404).json({ error: 'Balade non trouvée.' });
        }

        res.status(200).json(balade);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la balade.' });
    }
});
//ROute13

router.put('/update-many/:search', async (req, res) => {
    try {
        const { search } = req.params;
        const { nom_poi } = req.body;

        if (!nom_poi) {
            return res.status(400).json({ error: 'Le nom_poi est obligatoire.' });
        }

        const regex = new RegExp(search, 'i'); // Expression régulière insensible à la casse

        const balades = await Balade.updateMany({ texte_description: { $regex: regex } }, { nom_poi });

        if (balades.nModified === 0) {
            return res.status(404).json({ error: 'Aucune balade à mettre à jour.' });
        }

        res.status(200).json({ message: 'Balades mises à jour avec succès.' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour des balades.' });
    }
});
//Route14
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const balade = await Balade.findByIdAndDelete(id);

        if (!balade) {
            return res.status(404).json({ error: 'Balade non trouvée.' });
        }

        res.status(200).json({ message: 'Balade supprimée avec succès.' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression de la balade.' });
    }
});
export default router ;

