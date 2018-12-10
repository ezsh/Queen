App = App || { Data: { }, Entity: { } };
App.Data.EffectLib = App.Data.EffectLib || {};

// This file lists effects that happens with body on their own with time
/** HEALTH */
App.Data.EffectLib.NATURAL_HEALING = {
    "FUN" : /** @param {App.Entity.Player} p
     @param {App.Items.Consumable} o*/
    function(o, p) { p.DoHealing(1); },
    "VALUE" : 0, "KNOWLEDGE" : [ "Healing+" ]
};

/** NUTRITION*/
App.Data.EffectLib.NATURAL_NUTRITION = {
    "FUN" : /** @param {App.Entity.Player} p
     @param {App.Items.Consumable} o*/
    function(o, p) {
		p.AdjustStat("Nutrition", -5);
		var nutrition = p.GetStat("STAT", "Nutrition");
		if (nutrition > 150) {
			p.AdjustBodyXP("Waist", nutrition - 150); // Get Fatter!?
		}
		// Going hungry, lose some belly fat.
        if (nutrition < 50) {
            p.AdjustBodyXP("Waist", -25);
        }
        // Starving. Yikes.
        if (nutrition < 20) {
            p.SleepLog.push("@@color:red;You are starving!@@");
            p.AdjustStat("Energy", -1); // Reduce Energy.
            p.AdjustStat("Health", -15);
            p.AdjustBodyXP("Waist", -50);
        }
	},
    "VALUE" : 0, "KNOWLEDGE" : [ "Hunger+" ]
};

/** TOXICITY */
App.Data.EffectLib.NATURAL_DETOXIFICATION = {
    "FUN" : /** @param {App.Entity.Player} p
    @param {App.Items.Consumable} o*/
   function(o, p) { p.AdjustStat("Toxicity", -( (5 + (p.GetStat("STAT", "Fitness") / 10)))*2); },
   "VALUE" : 0, "KNOWLEDGE" : [ "Detoxification+" ]
};

/** HORMONES */
App.Data.EffectLib.NATURAL_HORMONE_SHIFT = {
	"VALUE" : 0, "KNOWLEDGE" : [ "Hormonal processes+" ],
	"FUN" : /** @param {App.Entity.Player} p
	@param {App.Items.Consumable} o*/
   function(o, p) {
        //Adjust physical characteristics based on hormone balance. Only shift body if there is XP related to the hormone
        //shift stored in the player object.
        var HormoneShift = 0;

        if ((this.GetStat("STAT", "Hormones") > 100) && this.GetStatXP("STAT", "Hormones") > 0 ) {
            HormoneShift = ( this.GetStat("STAT", "Hormones") - 100 );
            this.AdjustBodyXP("Face",   HormoneShift            ,     40);
            this.AdjustBodyXP("Bust",   HormoneShift            ,      5);
            this.AdjustBodyXP("Lips",   HormoneShift            ,     40);
            this.AdjustBodyXP("Ass",    HormoneShift            ,     10);
            this.AdjustBodyXP("Hips",   HormoneShift            ,     10);
            // The "Futa" stat blocks penis shrinking if penis stat is lower or equal to the futa stat.
            // The balls shrinking is not affected, as usual futas have no balls.
            var FutaPercent = this.GetStatPercent("STAT", "Futa");
            var PenisPercent = this.GetStatPercent("BODY", "Penis");
            if (PenisPercent > FutaPercent) {
                this.AdjustBodyXP("Penis", (HormoneShift * -1.0)    ,      1);
            }
            this.AdjustBodyXP("Balls", (HormoneShift * -1.0)    ,      0);
        } else {
            if (p.GetStatXP("STAT", "Hormones") < 0) {
                HormoneShift = ( 100 - p.GetStat("STAT", "Hormones"));
                p.AdjustBodyXP("Face", (HormoneShift * -1.0), p.GetStartStat("BODY", "Face"));
                p.AdjustBodyXP("Bust", (HormoneShift * -1.0), p.GetStartStat("BODY", "Bust"));
                p.AdjustBodyXP("Lips", (HormoneShift * -1.0), p.GetStartStat("BODY", "Lips"));
                p.AdjustBodyXP("Ass",  (HormoneShift * -1.0), p.GetStartStat("BODY", "Ass"));
                p.AdjustBodyXP("Hips", (HormoneShift * -1.0), p.GetStartStat("BODY", "Hips"));
                p.AdjustBodyXP("Penis", HormoneShift, p.GetStartStat("BODY", "Penis"));
                p.AdjustBodyXP("Balls", HormoneShift, p.GetStartStat("BODY", "Balls"));
            }
        }
    }
};

/** FITNESS */
App.Data.EffectLib.NATURAL_FITNESS_DECREASE = {
    "FUN" : /** @param {App.Entity.Player} p
     @param {App.Items.Consumable} o*/
    function(o,p) { p.AdjustStatXP("Fitness", -5); },
    "VALUE" : 0, "KNOWLEDGE" : [ "Flabbiness+" ]
};
/** HEIGHT */
/** HAIR */
App.Data.EffectLib.NATURAL_HAIR_GROW = {
    "FUN" : /** @param {App.Entity.Player} p
        @param {App.Items.Consumable} o*/
    function(o,p) { p.AdjustBodyXP("Hair", 4, 0); /* Hair grows about 0.05 CM per day.*/ },
    "VALUE" : 0, "KNOWLEDGE" : [ "Hair grow+" ]
};

/** FACE */
/** BUST */
/** BUST FIRMNESS */
App.Data.EffectLib.NATURAL_BUST_SAGGINESS = {
    "FUN" : /** @param {App.Entity.Player} p
     @param {App.Item.Consumable} o*/
    function(o,p) { p.AdjustBodyXP('BustFirmness', -1 * Math.pow(p.GetStat('BODY', 'Bust'), 2) / 300); },
    "VALUE" : 0, "KNOWLEDGE" : [ "Bust Sag+" ]
};

/** LACTATION */
App.Data.EffectLib.NATURAL_LACTATION_DECREASE = {
    "FUN" : /** @param {App.Entity.Player} p
    @param {App.Items.Consumable} o*/
    function(o,p) { p.AdjustBodyXP("Lactation", -100, 0); },
    "VALUE" : 0
};
/** ASS */
/** HIPS */
/** LIPS */
/** PENIS */
/** BALLS */
/** WAIST */

App.Data.NaturalBodyEffects = [
    "NATURAL_HEALING",
    "NATURAL_NUTRITION",
    "NATURAL_DETOXIFICATION",
    "NATURAL_HORMONE_SHIFT",
    "NATURAL_FITNESS_DECREASE",
    "NATURAL_HAIR_GROW",
    "NATURAL_LACTATION_DECREASE",
    "NATURAL_BUST_SAGGINESS"
];
