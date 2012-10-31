// **** Script pour le jeu Galaxy 55 ****
// **** Récupération automatique des prix d'achat et de vente des kubes. ****
// Diffusable et modifiable selon les termes de la licence GNU, ou de la licence CC-BY-SA.
// Créé par Réchèr.
// Mon profil Twinoid : http://twinoid.com/user/12910
// Mon blog : http://recher.wordpress.com/
// Mon adresse bitcoin : 12wF4PWLeVAoaU1ozD1cnQprSiKr6dYW1G (Devinez quoi ? J'accepte les dons).
//
// Version du script : 1.1 (31/12/2012)
// Fonctionne avec la version Alpha 5 de Galaxy 55.
//
// **** Mode d'emploi ****
//  - Connectez-vous au jeu, allez au marché des kubes, à la page des achats.
//  - Cochez la case "mode expert", en bas de la page.
//  - Ouvrez la console de votre navigateur 
//    (Firefox : Ctrl+Shift+K, Chrome : Ctrl+Shift+J, je ne sais pas pour les autres).
//  - Copier-collez tout ce texte dans la console (on peut balancer tout le texte d'un coup).
//  - Appuyez sur Entrée, et patientez quelques minutes, sans rien toucher dans votre navigateur.
//  - La liste complète des kubes, avec les cours, les prix d'achat et de ventes devrait 
//    finir par s'afficher dans la console.
//  - Vous pouvez copier cette liste et la placer dans le sujet du forum Twinoid prévu
//    à cet effet, afin que tout le monde profite des cours les plus récents.
//
// **** Principe de fonctionnement ****
// Le site de Galaxy 55 permet de saisir une chaîne de caractères, et il affichera la liste
// de tous les kubes incluant cette chaîne. On peut ensuite consulter le cours de chacun des 
// kubes de la liste.
// Tout cela semble fonctionner avec de l'ajax, ou un truc de ce genre. Ce qui veut dire que 
// la page web n'est pas entièrement rechargée lorsqu'on fait une recherche ou qu'on sélectionne
// un kube. Ça m'arrange bien, ça permet au script d'effectuer des actions, sans être interrompu.
// Et l'astuce, c'est qu'une liste de kube s'affiche dès la première lettre tapée dans la zone de
// recherche. Par exemple, si on écrit juste "e", on obtient tous les kubes dont le nom comporte
// la lettre "e". Soit un bon paquet de kube !
// Après vérification, il semblerait que tous les noms de kube comportent au moins une voyelle
// (aucun kube n'a un nom du style "nrsrnmnrsljsghfz").
// Le script effectue donc les actions suivantes :
//  - Saise du texte "-+++-" dans la zone de recherche. C'est un texte bidon, aucun nom de kube
//    ne contient cette chaîne (pour l'instant).
//  - Attente et vérification que la page affiche une liste de kube vide. 
//  - Saisie de la lettre "a" dans la zone de recherche.
//  - Attente et vérification que la page affiche une liste de kube non vide. Comme la liste était
//    précédemment vide, on est sûr que maintenant, elle correspond bien à la lettre "a", et non 
//    pas à un autre texte qu'on ne sait pas d'où il sortirait.
//  - Pour chaque kube de la liste :
//     * Le script simule un click dessus.
//     * Attente du chargement des informations de ce kube : prix d'achat, vente, etc.
//       Pour être sûr que les infos ont été bien chargée, on utilise une astuce pourrie, mais
//       j'en ai pas trouvé de meilleure. On regarde périodiquement les infos du kube, dès que
//       l'une d'elle a changée, on considère qu'elles ont été chargées. (On ne consulte pas
//       l'image affichant le graphique du cours, car je ne sais pas comment faire ça).
//     * Récupération des infos du kube sélectionné, clic sur le kube suivant, etc.
//  - Quand toute la liste de kube a été parcourue, on re-saist "-++-", ec on attend d'obtenir
//    une liste de kube vide.
//  - Saisie de la lettre suivante (e), attente d'une liste non vide, parcours de la liste, 
//    récupération des informations de chaque kube, etc.
//  - Pareil avec les autres lettres. Durant tout ce traitement, on peut tomber plusieurs fois
//    sur le même kube (par exemple, si son nom contient une lettre "e" et une lettre "a").
//    Avant de simuler un click sur un kube et de prendre ses infos, on vérifie qu'on ne l'a
//    pas déjà traité. Si oui, on passe directement au kube suivant. Ça optimise.
//  - À la fin, on logue toutes les infos dans la console, et l'utilisateur en fait ce qu'il veut.

// **** Constantes globales ****

DEBUG_MODE = false
// URL de vérification pour vérifier qu'on est bien au bon endroit.
EXPECTED_URL = "http://galaxy55.com/trade/buy"
// Nombre total de boucle d'itérations du scheduler principal, avant de considérer que le script 
// s'est bloqué quelque part et qu'il vaut mieux l'arrêter.
SCHEDULER_ITERATION_LIMIT = 500000
// Nombre de boucle d'itérations maximal, lors de l'attente du chargement complet de toutes les 
// infos du kube sélectionné. Si on dépasse cette valeur, on arrête d'attendre, et on prend les
// infos courantes pour les infos du kube sélectionné.
NB_MAX_TRY_TRADE_INFO_TO_CHANGE = 5000
// Critère de recherche bidon, qui ne doit être inclus dans aucun nom de kube existant.
// Etrange, si on met un slash dans le texte de recherche, ça fait pas de recherche. Bug ?
SEARCH_CRITERIA_NO_MATCH = "-+++-"
// Liste des critères de recherche permettante d'obtenir au moins une fois chaque kube.
// Il se trouve que tous les noms de kube comportent chacun une voyelle (et même pas besoin du y).
// Mais si jamais y'a des mises à jour du jeu, il y aura peut-être d'autres kubes supplémentaires,
// avec des noms sans voyelles. Dans ce cas, il faudra lancer le script en utilisant la liste de
// critère "STRONG_CHECK", au lieu de "WEAK_CHECK".
LIST_CRITERIA_WEAK_CHECK = new Array(
    "a", "e", "i", "o", "u")
// Liste des critères de recherche avec laquelle on est encore plus sûr de n'oublier aucun kube.
// Y'a pas les lettre k et w, car elles ne sortent aucun kube, et du coup ça bloque le script. 
// (Désolé, pas trouvé de meilleure méthode).
LIST_CRITERIA_STRONG_CHECK = new Array(
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "l", "m", "n", "o", "p",
    "q", "r", "s", "t", "u", "v", "x", "y", "z", " ", "-")
// Liste pour le mode debug, avec pas beaucoup de lettres, et contenant peu de kubes.
LIST_CRITERIA_DEBUG = new Array(
    "q", "y", "-")
// Nombre total de kube dans le marché, dans la version actuelle du jeu.    
NB_KUBE_EXPECTED = 130
// Période (en nombre de kube lus) d'affichage du pourcentage de progress dans la console.
PERIOD_NB_KUBE_LOG_PROGRESS = 5
// Bla-bla d'en-tête, pour me faire de la pub parce que je suis trop bien comme mec.
STR_HEADER_TRADE_INFO_1 = " ** Listes des prix d'achat et de vente " +
                          "des kubes, pour le jeu Galaxy 55. **\n"
STR_HEADER_TRADE_INFO_2 = 
    " ** Le script ayant généré cette liste vous est proposé par Réchèr.\n" +
    " ** Mon Profil Twinoid : http://twinoid.com/user/12910\n" +
    " ** Mon blog : http://recher.wordpress.com/\n" +
    " ** Mon adresse bitcoin : 12wF4PWLeVAoaU1ozD1cnQprSiKr6dYW1G\n" + 
    " ** (Devinez quoi ? J'accepte les dons).\n"
// Titre des colonnes affichées pour la liste des kubes, qu'on logue à la fin du traitement.
A_COLUMN_TRADE_INFO_NAMES = new Array(
    "Kube ", " Cours", 
    " Achat Max", " Achat Min", " Vente Min", " Vente Max")
// Nombre de colonne de la liste des kubes.
NB_COLUMN_TRADE_INFO = A_COLUMN_TRADE_INFO_NAMES.length
// Définition de la liste de critère de recherche réellement utilisée.
if (DEBUG_MODE)
{ 
    gListSearchCriteria = LIST_CRITERIA_DEBUG 
}
else
{
    // À remplacer par LIST_CRITERIA_STRONG_CHECK si on veut faire un strong check. D'où le nom.
    gListSearchCriteria = LIST_CRITERIA_WEAK_CHECK 
}

// Énumération des différentes actions listées dans le scheduler.
// On est obligé de fonctionner avec un scheduler, comportant des petits bouts de code 
// éparpillés, parce que cet andouille de javascript ne comporte pas de fonction permettant
// d'attendre X secondes. Au lieu de ça, il faut utiliser la fonction setTimeout.
// C'est très moche.
action = {
    initialCheck : 0,
    changeSearchValueToNoMatch : 10,
    changeSearchValueToNextCrit : 11,
    initateLoopOnKubes : 12,
    searchNextUnknownKube: 13,
    selectOneKube : 14,
    getKubeTradeInfo : 15,
    logInConsole : 16,
    WriteInPasteBin : 17,
    finished : 999
}

// **** Variables globales ****

// Nombre actuel d'itération effectuées dans le scheduler.
gSchedulerIteration = 0
// Position actuelle dans la fonction mainScheduler, qui gère tout le déroulement du code.
// J'aurais bien organisé le déroulement de manière plus claire, mais y'a que des SetTimeOut
// et pas de fonctions delay dans ce foutu javascript tout bizarre. (Je l'ai déjà dit, mais je
// le redis, car je suis fou et j'aime bien me répéter, voire me lire parler. 
// Non... m'écouter parler. Oh laissez tomber.
gCurrentAction = action.initialCheck
// node HTML de la zone de texte dans laquelle on saisit un critère de recherche.
gTextAreaSearch = null
// Nombre actuel d'itération effectuées pendant l'attente du chargement complet 
// des infos d'un kube.
gAskBidInfoIteration = 0
// Index, dans la liste des kube affichée dans la partie gauche de la page, du prochain
// kube à sélectionner, quand le kube en cours aura été traité.
gIndexNextKube = 0
// Tuple de 6 éléments. Ce sont ceux qui mettent le plus de temps à se charger, lorsqu'on clique 
// sur un nouveau kube. Il suffit que l'un de ces éléments ait changé pour qu'on soit sûr que les
// nouvelles infos ont bien été chargées. La valeur du Cours n'est pas présente dans ce tableau, 
// car elle se réactualise plus vite que les autres. C'est donc pas un bon indicateur que tout
// a été complètement chargé. Les valeurs sont les suivantes :
// Achat Max, Achat Min, Vente Min, Vente Max, Date début du graphique, Date fin graphique.
gaPreviousInfoSlowlyLoaded = new Array("", "", "", "", "", "")
// Nombre de kube affichés dans la liste de la partie gauche de la page.
gNbKubeToFetch = 0
// Liste de node HTML, contenant chacun l'un des kube sur lequel on peut cliquer dessus.
gListNodeLiKube = null
// Node HTML représentant l'un des kubes de la liste. Ce node permet d'obtenire le nom du kube, 
// ainsi qu'un bouton cliquable, pour le sélectionner.
gNodeButtonKube = null
// Nom du kube actuellement sélectionné.
gKubeName = ""
// Liste de tuples de 6 éléments : Nom du kube, Cours, Achat Max, Achat Min, Vente Min, Vente Max.
// Cette liste représente toutes les informations de tous les kubes actuellement traités.
// À la fin du parcours des kubes et des critères de recherche, c'est le contenu de cette liste 
// qu'on affiche dans la console.
gListKubeTradeInfo = new Array()
// Liste de string, contenant les noms des kubes dont on a déjà récupéré les infos.
gListKnownKubeName = new Array() 
// Gigantesque chaîne de caractères, contenant mes en-têtes de blabla et tous le tableau des infos
// des kubes. Faut loguer le tout dans la console.
gStrBigChart = ""

// **** Fonctions génériques toutes simples ****

function logdebug(text)
{
    if (DEBUG_MODE) { console.log(text) }
}

function logerror(text)
{
    console.log(" ##### " + text + " ##### ") 
}

// équivalent de jQuery.inArray, mais je fais pas confiance à jQuery. Voir fin du fichier.
function isInTab(valToSearch, tabSearched)
{
    for (i=0 ; i<tabSearched.length ; i++)
    {
        if (tabSearched[i] == valToSearch) { return true }
    }
    return false
}

// **** Fonctions encore un peu génériques, mais moins que celles d'avant ****

// Écrit quelque chose dans la zone de texte des critères de recherches, et prévient
// le navigateur internet qu'une nouvelle valeur a été saise (comme ça il lance la recherche).
function changeSearchValue(strVal)
{
    gTextAreaSearch.value = strVal
    gTextAreaSearch.onkeydown()
}

// Renvoie le nombre de kube dans la liste de la partie gauche de la page, affichant
// tous les kubes correspondants au critère de recherche préalablement saisi.
// Met éventuellement à jour la variable globale gListNodeLiKube.
function getNbKubeListed(bUpdateGlobalListNodeLiKube)
{
    nodeBlock = document.getElementById("buy_dump")
    listNodeLiKube = nodeBlock.getElementsByTagName('li')
    if (bUpdateGlobalListNodeLiKube)
    {
        gListNodeLiKube = listNodeLiKube
    }
    return listNodeLiKube.length
}

// Petite fonction pour factoriser quelques récupérations d'informations.
// Fonctionne pour le Volume journalier, et les Achats/Ventes Min/Max.
function getStrInSpan(idContainerSpan)
{
    nodeDrilled1 = document.getElementById(idContainerSpan)
    if (nodeDrilled1 == null) { return "" }
    nodeDrilled2 = nodeDrilled1.getElementsByTagName("span")
    if (nodeDrilled2.length == 0) { return "" }
    strInfo = nodeDrilled2[0].innerHTML
    return strInfo
}

// Renvoie le volume journalier.
function getVolume()
{
    return getStrInSpan("daily_volume")
}

// Renvoie le cours (en crédit EScorp) du kube actuellement sélectionné.
function getSelKubeCours()
{
    strCours = document.getElementsByClassName("curPrice")[0].innerHTML
    return strCours
}

// Renvoie un tableau de 2 strings, contenant les dates de début et de fin du graphique.
// On ne peut pas savoir si c'est les dates du kube qu'on vient tout juste de sélectionner,
// ou si c'est les dates du kube précédemment sélectionné, et que les nouvelles dates n'ont
// pas encore été chargée mais qu'elles arriveront toute seule dans quelques temps.
// Pour le savoir, faut comparer avec d'anciennes dates gardées en mémoire.
function getSelKubeGraphDates()
{
    aGraphDates = new Array("", "")
    nodeDrill1 = document.getElementsByClassName("currentHistory")[0]
    if (nodeDrill1 == null) { return aGraphDates }
    nodeDrill2 = nodeDrill1.getElementsByTagName("div")
    if (nodeDrill2 == null) { return aGraphDates }
    if (nodeDrill2.length < 2) { return aGraphDates }
    strDateStart = nodeDrill2[1].innerHTML
    strDateEnd = nodeDrill2[2].innerHTML
    aGraphDates = new Array(strDateStart, strDateEnd)
    return aGraphDates
}

// Renvoie un tableau de 4 strings, contenant achat max, achat min, vente min et vente max.
// On ne peut pas savoir si c'est les valeurs du kube qu'on vient tout juste de sélectionner,
// ou si c'est les valeurs du kube précédemment sélectionné.
function getSelKubeAskBid()
{    
    strAchatMax = getStrInSpan("best_ask")
    strAchatMin = getStrInSpan("worst_ask")
    strVenteMin = getStrInSpan("worst_bid")    
    strVenteMax = getStrInSpan("best_bid")
    aKubeAskBidInfo = new Array(strAchatMax, strAchatMin, 
                                strVenteMin, strVenteMax)
    return aKubeAskBidInfo
}

// **** Fonctions if check, utilisé par waitForSomething ****
// Ces fonctions doivent obligatoirement renvoyer un booléen.
// Elles ont pour but de vérifier qu'un élément spécifique de la page a bien été actualisé. 
// La foncton waitForSomething appelle périodiquement l'une de ses fonctions, 
// et attend que celle-ci renvoie true, avant de poursuivre la suite du code. Cela permet 
// de s'assurer que les données dont on a besoin ont bien été chargée et actualisée.
// (Je ne sais pas comment faire pour s'assurer qu'une requêtes Ajax, ou le truc-bidule utilisé
// pour les échanges avec le serveur, s'est totalement terminé. Donc je fais comme ça, même si
// c'est un peu bourrin-cradoc comme méthode).

// Vérife que la liste de la partie gauche de la page n'affiche aucun kube.
function checkNoKube()
{
    nbKube = getNbKubeListed(false)
    logdebug(nbKube)
    return (nbKube == 0)
}

// Vérife que la liste de la partie gauche de la page ffiche au moins un kube.
function checkSomeKube()
{
    nbKube = getNbKubeListed(false)
    return (nbKube != 0)
}

// Mini-fonction dummy, qui n'attend rien, et autorise immédiatement le waitForSomething
// à passer à l'action suivante.
function immediate()
{
    return true
}

// Vérifie que toutes les informations relatives au kube sélectionné ont bien été chargées.
function checkKubeInfoLoaded()
{   
    // Récupération du nom du kube sélectionné, en bas dans la fenêtre. On vérifie la présence de 
    // chaque node au fur et à mesure qu'on creuse dedans, car on n'est pas sûr que tout soit 
    // chargé.
    listNodeDrilled1 = document.getElementsByClassName("bloc_here")
    if (listNodeDrilled1.length == 0)
    {
        return false
    }    
    nodeDrilled1 = listNodeDrilled1[0]
    listNodeDrilled2 = nodeDrilled1.getElementsByTagName("div")
    if (listNodeDrilled2.length == 0)
    {
        return false
    }        
    nodeSelectedKube = listNodeDrilled2[0]
    nameSelectedKube = nodeSelectedKube.getAttribute("title")
    if (gKubeName != nameSelectedKube)
    {
        logdebug(nameSelectedKube + " différent de : " + gKubeName)
        return false    
    }
    // Récupération des infos qui mettent longtemps à se charger, et comparaison avec les infos
    // du kube précédent.
    aCurrentAskBidInfo = getSelKubeAskBid()
    aCurrentGraphDates = getSelKubeGraphDates()
    aCurrentInfoSlowlyLoaded = aCurrentAskBidInfo.concat(aCurrentGraphDates)
    logdebug(aCurrentInfoSlowlyLoaded)
    for (i=0 ; i<aCurrentInfoSlowlyLoaded.length ; i++)
    {
        cur = aCurrentInfoSlowlyLoaded[i]
        prev = gaPreviousInfoSlowlyLoaded[i]
        if (cur != prev) { 
            // Y'a un truc qu'a changé. Donc les infos qui mettent du temps à se charger se sont
            // bien chargé. On va pouvoir récupérer les infos du kube en cours. On réactualise
            // le tableau des infos qui mettent du temps à se charger, pour la prochaine fois.
            gaPreviousInfoSlowlyLoaded = aCurrentInfoSlowlyLoaded
            return true 
        }
    }
    // Ça peut arriver d'avoir deux kubes qui se suivent avec exactement les mêmes infos.
    // Il faut donc une limite de nombre d'essais pour pas que ça se bloque dessus. 
    // C'est un peu moisi du cul comme astuce, mais j'ai pas d'autres solutions.
    gAskBidInfoIteration++
    if (gAskBidInfoIteration > NB_MAX_TRY_TRADE_INFO_TO_CHANGE)
    {
        logerror("Deux kubes de suite avec les mêmes infos : " + gKubeName)
        return true
    }
    return false
}

// Fonction qui attend un truc (spécifié par funcCondition), et indique ensuite au scheduler 
// de passer à une action suivante (spécifié par actionNext).
// C'est vraiment pas pratique cette histoire de timeOut. Ça découpe le code à des endroits 
// qui n'ont aucun lieu d'être découpé. Du coup je suis obligé de claquer un crétin de scheduler,
// et des variables globales de partout. Merci Javascript !!
function waitForSomething(funcCondition, actionNext)
{
    gSchedulerIteration++
    if (gSchedulerIteration > SCHEDULER_ITERATION_LIMIT)
    {
        logerror("Bon, ça fait longtemps que ça tourne...")
        logerror("Ça a du se bloquer quelque part. On abandonne. Désolé !")
        return
    }
    if (funcCondition())
    {    
        gCurrentAction = actionNext
        setTimeout(mainScheduler, 1)
    }    
    else
    {
        setTimeout(
            function() { waitForSomething(funcCondition, actionNext) },
            1)    
    }
}

// **** Fonctions pour la mise en forme de la liste de kube, quand on l'écrit dans le log ****

// Renvoie un texte sur un nombre fixe de caractères, en complétant avec des espaces, à gauche ou
// à droite de la chaîne.
// ATTENTION !! J'ai pas mis de vérification, du coup, si width est plus petit que la longueur de
// strText, ça plante. M'en fout, pas besoin de cette vérif. Mais c'est toujours bon à savoir.
function justifyText(strText, width, bJustifyRight)
{
    nbSpace = width - strText.length
    strSpace = Array(nbSpace+1).join(" ")
    if (bJustifyRight)
    {
        return strSpace + strText
    }
    else
    {
        return strText + strSpace
    }
}

// Renvoie un tableau de taille NB_COLUMN_TRADE_INFO, contenant des entiers. Il s'agit des 
// largeurs de chaque colonne. Pour chaque colonne, on prend la valeur ayant le plus de 
// caractères, et on l'utilise pour la largeur. (Parmi les valeurs parcourues, ont inclus
// les titres de chaque colonne). 
function determineColumnWidth()
{
    aColumnWidth = new Array(NB_COLUMN_TRADE_INFO)
    for (indexColumn=0 ; indexColumn<NB_COLUMN_TRADE_INFO ; indexColumn++) 
    { 
        // initialisation de la largeur de la colonne, avec la largeur du texte de 
        // la 1ère ligne. (C'est à dire les noms des colonnes).
        colWidth = A_COLUMN_TRADE_INFO_NAMES[indexColumn].length
        aColumnWidth[indexColumn] = colWidth
        for (indexLine=0 ; indexLine<gListKubeTradeInfo.length ; indexLine++)
        {
            newColWidth = gListKubeTradeInfo[indexLine][indexColumn].length
            if (aColumnWidth[indexColumn] < newColWidth)
            {
                aColumnWidth[indexColumn] = newColWidth
            }
        }
    }
    return aColumnWidth
}

// Renvoie une string, contenant une ligne de la liste de kube à loguer, avec toutes les valeurs 
// bien formatée comme il faut.
function formatOneLine(aLineInfo, aColumnWidth)
{
    strLine = ""
    aFormattedCells = new Array()
    for (indexColumn=0 ; indexColumn<NB_COLUMN_TRADE_INFO ; indexColumn++) 
    {
        bJustifyRight = (indexColumn != 0)
        formattedCell = justifyText(
            aLineInfo[indexColumn], 
            aColumnWidth[indexColumn], 
            bJustifyRight)
        aFormattedCells.push(formattedCell)
    }
    strLine = aFormattedCells.join("|") + "\n"
    return strLine
}

// Renvoie une grande chaîne de caractères, contenant toute la liste d'infos des kubes,
// formatées comme il faut, et présentable dans le log.
function formatAllTradeInfo(aColumnWidth)
{
    strBig = formatOneLine(A_COLUMN_TRADE_INFO_NAMES, aColumnWidth)
    for (indexLine=0 ; indexLine<gListKubeTradeInfo.length ; indexLine++)
    {
        strLine = formatOneLine(gListKubeTradeInfo[indexLine], aColumnWidth)
        strBig += strLine
    }
    return strBig
}

// **** La fameuse fonction scheduler ****
// C'est en quelque sorte la fonction "main" du script. Même si c'est un main avec du code éclatés
// en petit morceaux à des endroits où ça devrait pas vraiment être éclaté, mais c'est pas grave.

function mainScheduler()
{
    logdebug("action : " + gCurrentAction + " iter : " + gSchedulerIteration)
    // la syntaxe du switch-case... Toujours aussi moche.
    switch (gCurrentAction)
    {
        case action.initialCheck:
        {
            if (document.location != EXPECTED_URL)
            {
                logerror("Vous ne semblez pas être au bon endroit.")
                logerror("Vérifiez que vous êtes sur la page des Achats :")
                logerror(EXPECTED_URL)
                return
            }
            gTextAreaSearch = document.getElementsByTagName('textarea')[0]
            if (gTextAreaSearch == null)
            {
                logerror("Impossible de trouver la zone de texte")
                logerror("permettant de rechercher les kubes.")
                logerror("Vérifiez que vous êtes sur la page des Achats :")
                logerror(EXPECTED_URL)
                return
            }
            nodeCheckBoxExpert = document.getElementsByName("expert")[0]
            if (nodeCheckBoxExpert == null)
            {
                logerror("Impossible de trouver la check-box 'expert'")
                logerror("Vérifiez que vous êtes sur la page des Achats :")
                logerror(EXPECTED_URL)
                return
            }
            if (!nodeCheckBoxExpert.checked)
            {
                logerror("Cochez la case 'Mode eXpert' en bas de la page,")
                logerror("puis relancez le script.")
                return
            }
            console.log("Récupération des informations. Veuillez patientez.")
            waitForSomething(immediate, action.changeSearchValueToNoMatch)
            break
        }
        case action.changeSearchValueToNoMatch:
        {
            changeSearchValue(SEARCH_CRITERIA_NO_MATCH)
            waitForSomething(checkNoKube, action.changeSearchValueToNextCrit)
            break
        }
        case action.changeSearchValueToNextCrit:
        {
            if (gListSearchCriteria.length == 0)
            {
                waitForSomething(immediate, action.logInConsole)
            }
            else
            {
                strSearchValue = gListSearchCriteria.shift()
                changeSearchValue(strSearchValue)
                waitForSomething(checkSomeKube, action.initateLoopOnKubes)
            }
            break
        }        
        case action.initateLoopOnKubes:
        {
            gIndexNextKube = 0
            gNbKubeToFetch = getNbKubeListed(true)
            waitForSomething(immediate, action.searchNextUnknownKube)
            break
        }
        case action.searchNextUnknownKube:
        {
            bFoundUnknownKube = false
            while (!bFoundUnknownKube && (gIndexNextKube < gNbKubeToFetch))
            {
                // récupération du noeud HTML du kube dans la liste de recherche. Ça permet 
                // d'avoir son nom, ainsi que le bouton à cliquer si on veut le slectionner.
                nodeLiKube = gListNodeLiKube[gIndexNextKube]
                gNodeButtonKube = nodeLiKube.getElementsByTagName('div')[1]
                gIndexNextKube++
                gKubeName = gNodeButtonKube.getAttribute("data-name")
                logdebug("bouclage sur : " + gKubeName)
                bFoundUnknownKube = !(isInTab(gKubeName, gListKnownKubeName))
            }
            if (bFoundUnknownKube)
            {
                waitForSomething(immediate, action.selectOneKube)
            }
            else
            {
                waitForSomething(immediate, action.changeSearchValueToNoMatch)
            }
            break
        }
        case action.selectOneKube:
        {
            logdebug("sélection de : " + gKubeName)
            gNodeButtonKube.click()
            gAskBidInfoIteration = 0
            waitForSomething(checkKubeInfoLoaded, action.getKubeTradeInfo)
            break
        }
        case action.getKubeTradeInfo:
        {
            // On récupère des infos déjà récupérées avant (lors de checkKubeInfoFullyLoaded). 
            // Je les re-récupère ici. C'est plus simple, ça évite une nouvelle variable globale
            // de merde, et de toutes façons, on a passé notre temps à les récupérer en boucle
            // pour attendre qu'elles changent. Alors un de plus ou un de moins...
            aAskBidInfo = getSelKubeAskBid()
            strCours = getSelKubeCours()
            aKubeTradeInfo = Array(gKubeName, strCours)
            aKubeTradeInfo = aKubeTradeInfo.concat(aAskBidInfo)
            logdebug(aKubeTradeInfo)
            gListKubeTradeInfo.push(aKubeTradeInfo)
            gListKnownKubeName.push(gKubeName)
            // log du progress.
            nbKube = gListKubeTradeInfo.length
            if (nbKube % PERIOD_NB_KUBE_LOG_PROGRESS == 0)
            {
                progress = Math.round((nbKube * 100) / NB_KUBE_EXPECTED)
                console.log(progress + "%")
            }
            waitForSomething(immediate, action.searchNextUnknownKube)
            break
        }        
        case action.logInConsole:
        {
            gListKubeTradeInfo.sort()
            aColumnWidth = determineColumnWidth()
            dateNow = new Date()
            nbKube = gListKubeTradeInfo.length
            if (nbKube != NB_KUBE_EXPECTED)
            {
                logerror("Nombre de kube différent de celui prévu." + 
                         "(" + NB_KUBE_EXPECTED + ")")
                logerror("À l'occaz' : lancez le script avec un strong-check")
                logerror("et remettez le script à jour.")
            }
            gStrBigChart = ""
            gStrBigChart += STR_HEADER_TRADE_INFO_1
            gStrBigChart += " ** Date de génération : " + dateNow + "\n"
            gStrBigChart += STR_HEADER_TRADE_INFO_2
            gStrBigChart += formatAllTradeInfo(aColumnWidth)
            gStrBigChart += " ** Volume aujourd'hui : " + getVolume() + "\n"
            gStrBigChart += " ** Nombre de kubes : " + nbKube + "\n"
            console.log(gStrBigChart)
            waitForSomething(immediate, action.finished)
            break
        }
        case action.finished:
        {
            logdebug("C'est fini.")
            break
        }        
    }
}

// Exécution immédiate de la fonction, comme ça l'utilisateur n'a plus qu'à appuyer sur Entrée.
mainScheduler()

// **** Truc que j'ai pas réussi à faire avec ce boulet jQuery auquel je ne comprends rien. ****

// Ça, ça marche, mais vu que tout le reste marche pas, j'ai pas confiance.
//indexCurrentCube = jQuery.inArray(gKubeName, gListKnownKubeName)
//bFoundUnknownKube = (indexCurrentCube == -1)

// ça marche 1 fois sur 2 ce truc. Merci jQuery. Je comprends rien.
// Quand je le tape dans la console, ça marche tout le temps. Quand c'est pendant un script, 
// ça dépend...
//connerieDeJquery = $("span.bloc_here div.slot.full")

// Pareil. Ça marche quand ça veut.
//strCours = $("span.price span.curPrice")[0].innerHTML
//strAchatMax = $("div#best_ask span.tgt")[0].innerHTML
//strAchatMin = $("div#worst_ask span.tgt")[0].innerHTML
//strVenteMin = $("div#worst_bid span.tgt")[0].innerHTML    
//strVenteMax = $("div#best_bid span.tgt")[0].innerHTML
//strVolume = $("div#daily_volume span.tgt")[0].innerHTML

// **** Truc pas réussi à faire car j'arrive pas à changer d'url en gardant mes SetTimeout. ****

// Je me sers pas de ça, car ça marche pas. Voir commentaire ci-dessous, juste après la fonction. 
//function check0binLoaded()
//{
//    logdebug("coucou")
//    gNodeTextContent = document.getElementById("content")
//    if (gNodeTextContent == null) { return false }
//    gNodeExpir = document.getElementById("expiration")
//    if (gNodeExpir == null) { return false }
//    listNodeButton = document.getElementsByClassName("btn btn-primary")
//    if (listNodeButton.length == 0) { return false }
//    gNodeSubmit = listNodeButton[0]
//    return true
//}

// Ça marche pas ce truc. Je perds mon SetTimeout lorsque la nouvelle page est chargée. Tant pis !
//console.log("Les infos sont récupérées. On va essayer de les envoyer dans le pastebin.")
//window.location.href = "http://0bin.net/";
//waitForSomething(check0binLoaded, action.WriteInPasteBin)

//case action.WriteInPasteBin:
//{
//    gNodeTextContent = gStrBigChart
//    gNodeExpir.value = "1_month"
//    gNodeSubmit.click()            
//    waitForSomething(immediate, action.finished)
//    break
//}

// APPUYEZ SUR ENTRÉE POUR LANCER LE SCRIPT.
