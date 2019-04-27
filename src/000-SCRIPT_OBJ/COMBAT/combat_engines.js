// Generic engine with default behavior
App.Combat.Engines.Generic = class GenericEngine {

    constructor( owner, myStatusCB, theirStatusCB, chatLogCB )
    {
        this._owner = owner; // The object that owns this engine.
        this._myStatusCB = myStatusCB; // Callback for updating a html component
        this._theirStatusCB = theirStatusCB; // Callback for updating a html component
        this._chatLogCB = chatLogCB; // Callback for updating an html component

        if ( typeof this._owner === 'undefined' ) throw new Error("You must associate this engine with an owner.");

        this._AttackHistory = [ ];
    }

    /**
     * @returns {App.Combat.Combatant|App.Combat.Player}
     */
    get Owner() { return this._owner }

    get LastMove() {
        return this._AttackHistory.length >= 1 ? this._AttackHistory[this._AttackHistory.length-1] : null;
    }

    /**
     * Attack the enemy
     * @param {App.Combat.Combatant|App.Combat.Player} Target
     * @param {*} Command 
     */
    AttackTarget(Target, Command) {
  
        var roll = this.CalculateHit(Target, Command);

        // Try to hit target
        if (roll > 0) {
            this._AttackHistory.push(Command.Name);
            this.ConsumeResources(Command);
            this.DoDamage(Target, Command, roll);
            this.ApplyEffects(Target, Command, roll);
            this.Owner.RecoverCombo(this.GenerateCombo(Target, Command, roll));
            return true;
        } else {
            this._AttackHistory.push("Miss");
            this.ConsumeResources(Command);
            var Message = this.GetMissMessage(Command.Miss);
            this.PrintMessage(Message, Target);
            return false;
        }
    }

    Recover()
    {
        // use energy for stamina
        this.Owner.UseEnergy(1);
        this.Owner.RecoverStamina(100);
        this.Owner.AddWeaponDelay(10);
        if (this.Owner.IsNPC == true) {
            this.PrintMessage("<span style='color:lime'>NPC_NAME catches a second wind!</span>", this.Owner);
        } else {
            this.PrintMessage("<span style='color:lime'>You pull deep from your reserves and catch a second wind!</span>", this.Owner);
        }
    }
    Defend()
    {
        this.Owner.RecoverStamina(10); // Regain some stamina
        this.Owner.AddEffect('GUARDED', 2);
        this.Owner.AddWeaponDelay(10);
        if (this.Owner.IsNPC == true) {
            this.PrintMessage("<span style='color:lime'>NPC_NAME assumes a defensive position.</span>", this.Owner);
        } else {
            this.PrintMessage("<span style='color:lime'>You assume a defensive position and catch your breath.</span>", this.Owner);
        }
    }

    DoAI(Target)
    {
        if (this.Owner.IsNPC == true) {
            this.PrintMessage("<span style='color:red'>*BUG*</span> NPC_NAME doesn't know what to do!", this.Owner);
        } else {
            this.PrintMessage("<span style='red'>*BUG* NO AI routine implemented for player attack.", this.Owner);
        }
    }

    ConsumeResources(Command) {
        this.Owner.UseStamina(Command.Stamina);
        this.Owner.UseCombo(Command.Combo);
        this.Owner.AddWeaponDelay(Command.Speed);
    }

    CheckCommand(Command) {
        //console.log(Command);
        if (Command.Unlock(this.Owner) == false) return false;
        if (Command.Stamina > this.Owner.Stamina) return false;
        if (Command.Combo > this.Owner.Combo) return false;

        return true;
    }

    /**
     * Calculate if an attack hits.
     * @param {App.Combat.Combatant|App.Combat.Player} Target  Entity that you are attacking
     */
    CalculateHit(Target)
    {
        const MyRoll = this.Owner.AttackRoll(); //Includes getting attack buffs
        const TheirRoll = Target.DefenseRoll(); //Includes getting defense buffs
        console.log("CalculateHit: MyRoll="+MyRoll+",TheirRoll="+TheirRoll);
        return (MyRoll - TheirRoll);
    }

     /**
     * @param {string} Message Miss array from attack definition.
     * @param {App.Combat.Combatant|App.Combat.Player} Target  Object we are attacking.
     */
    PrintMessage(Message, Target) {
        
        if (typeof this._chatLogCB === 'function') {
            if (this.Owner.IsNPC == true) {
                this._chatLogCB(Message, this.Owner);
            } else {
                this._chatLogCB(Message, Target);
            }
        }
    }

    DoDamage(Target, Command, roll)
    {
        var dmg = this.CalculateDamage(Target, Command, roll);
        // Apply effect bonuses
        if ( this.Owner.HasEffect('BLOODTHIRST')) dmg = Math.ceil( dmg * 1.5);
        if ( Target.HasEffect('GUARDED')) dmg = Math.floor( dmg * 0.7);
        if ( Target.HasEffect('PARRY'))  {
            dmg = 0; // block all damage.
            Target.ReduceEffect('PARRY', 1); // Reduce parry counter.
        }

        this.PrintHit(Command.Hit, Target, roll, dmg);
        Target.TakeDamage(dmg);

        if ( this.Owner.HasEffect('LIFE LEECH')) {
            var heal = Math.ceil( dmg * 0.5);
            this.Owner.RecoverHealth(heal);
            if (this.Owner.IsNPC == true) {
                this.PrintMessage("NPC_NAME heals " + heal + " damage.", Target);
            } else {
                this.PrintMessage("You heal " + heal + " damage.", Target);
            }
        }
    }

    CalculateDamage(Target, Command, Roll)
    {
        return 1;
    }

    ApplyEffects(Attack, Target, Effects)
    {

    }

    GenerateCombo(Target, Command, roll)
    {
        return 0;
    }

    PrintHit(Attacks, Target, Roll, Damage)
    {
        var len = Math.floor(Math.max(0, Math.min((Attacks.length * Roll), (Attacks.length-1))));
        var msg = (typeof this.Owner.IsNPC !== 'undefined' && this.Owner.IsNPC == true ) ? Attacks[len][1] : Attacks[len][0];
        msg += " <span style='color:red'>("+Damage+")</span>";
        this.PrintMessage(msg, Target);
    }

    /**
     * 
     * @param {Array.<string>} Arr Message to show to chat log for misses.
     */
    GetMissMessage(Arr) {
        const MissMessage = App.PR.GetRandomListItem(Arr);

        return (typeof this.Owner.IsNPC !== 'undefined' && this.Owner.IsNPC == true ) ? MissMessage[1] : MissMessage[0];
    }

};

// Unarmed combat class
App.Combat.Engines.Unarmed = class UnarmedCombatEngine extends App.Combat.Engines.Generic {

    constructor(...args)
    {
        super(...args);
    }

    get Class() { return "UNARMED"; }

    /**
     * Calculate the damage of an unarmed attack
     * @param {App.Combat.Combatant|App.Combat.Player} Target 
     * @param {*} Command 
     * @param {number} Roll 
     * @returns {number} Damage
     */
    CalculateDamage(Target, Command, Roll)
    {
        var base = 1;

        if (this.Owner.IsNPC == false) {
            base = Math.max(1, Math.min(Math.floor(this.Owner.Player.GetStat('STAT', 'Fitness')/20), 5));
        } else {
            base = base + Math.floor(this.Owner.Attack/20);
        }
        
        if (Command.Name != "Knee") {
            base = Math.floor(base * Command.Damage); // Add damage mod
        } else {
            var mod = Target.Gender == 1 ? 4.0 : 2.0; // Knee attack does more damage on male enemies
            base = Math.floor(base * mod);
        }

        return base;
    }

    /**
     * Generate any combo points
     * @param {App.Combat.Combatant|App.Combat.Player} Target  
     * @param {*} Command 
     * @param {*} Roll 
     * @returns {number} number of combo points to grant
     */
    GenerateCombo(Target, Command, Roll)
    {
        if ( (Command.Name == "Punch" && this.LastMove == "Kick") ||
             (Command.Name == "Kick" && this.LastMove == "Punch") ) {
                 return 1;
             }
             
        return 0;
    }

    /**
     * Apply effects to enemy
     * @param {App.Combat.Combatant|App.Combat.Player} Target  
     * @param {*} Command 
     * @param {*} Roll 
     */
    ApplyEffects(Target, Command, Roll)
    {

        if (Command.Name == 'Haymaker') {
            var chance = Math.max(10, Math.min((100 * Roll), 100));
            if ( chance >= Math.floor(Math.random() * 100)) {
                Target.AddEffect('STUNNED', 2);
                if (this.Owner.IsNPC) {
                    this.PrintMessage("NPC_NAME stuns you!", Target);
                } else {
                    this.PrintMessage("You stun NPC_NAME!", Target);
                }
            }
        }
    }

    DoAI(Target)
    {
        if (this.Owner.Combo >= this.Owner.Moves["Knee"].Combo) {
            this.AttackTarget(Target, this.Owner.Moves["Knee"]);
        } else if (this.Owner.Combo >= this.Owner.Moves["Haymaker"].Combo && Math.floor(Math.random()* 100) >= 60) {
            this.AttackTarget(Target, this.Owner.Moves["Haymaker"]);
        } else if (this.LastMove == "Kick") {
            this.AttackTarget(Target, this.Owner.Moves["Punch"]);
        } else {
            this.AttackTarget(Target, this.Owner.Moves["Kick"]);
        }
    }

};

//Swashbuckling Class
App.Combat.Engines.Swashbuckling = class SwashbucklingCombatEngine extends App.Combat.Engines.Generic {

    constructor(...args)
    {
        super(...args);
    }

    get Class() { return "SWASHBUCKLING"; }

    /**
     * Calculate the damage of an swashbuckling attack
     * @param {App.Combat.Combatant|App.Combat.Player} Target 
     * @param {*} Command 
     * @param {number} Roll 
     * @returns {number} Damage
     */
    CalculateDamage(Target, Command, Roll)
    {
        var base = 1;

        if (this.Owner.IsNPC == false) {
            var weaponQuality = this.Owner.GetWeaponQuality();
            var skill = this.Owner.Player.GetStat('SKILL', 'Swashbuckling');
            var fitness = this.Owner.Player.GetStat('STAT', 'Fitness');
            var mod =  1 + ( skill / 100) + (fitness / 100);

            base = Math.ceil(weaponQuality * mod);
        } else {
            base = base + Math.floor(this.Owner.Attack/10);
        }
        
        if (Command.Name == 'Riposte') { // Converts combo points into extra damage.
            // Drain all combo points.
            var combo = this.Owner.Combo;
            this.Owner.UseCombo(combo);
            
            base = base + (combo * 2); // bonus base damage from combo points.
        }

        if (Command.Name == 'Behead') { // Chance to do massive damage against enemies at low health
            if (Target.Health / Target.MaxHealth < 0.5) {
                var chance = (65 - Math.floor((100 * (Target.Health / Target.MaxHealth))));
                if (chance >= Math.floor(Math.random() * 100)) {
                    base = Target.Health;
                }
            }
        }

        base = Math.floor(base * Command.Damage); // Add damage mod

        return base;
    }

    /**
     * Generate any combo points
     * @param {App.Combat.Combatant|App.Combat.Player} Target  
     * @param {*} Command 
     * @param {*} Roll 
     * @returns {number} number of combo points to grant
     */
    GenerateCombo(Target, Command, Roll)
    {
        if ( (Command.Name == "Slash" && this.LastMove == "Stab") ||
             (Command.Name == "Stab" && this.LastMove == "Slash") ) {
                 return 1;
             }

        if ( Command.Name == 'Parry') { return 1; } // yeet
             
        return 0;
    }

    /**
     * Apply effects to enemy
     * @param {App.Combat.Combatant|App.Combat.Player} Target  
     * @param {*} Command 
     * @param {*} Roll 
     */
    ApplyEffects(Target, Command, Roll)
    {

        if (Command.Name == 'Parry') {
            this.Owner.AddEffect('GUARDED', 2);
            this.Owner.AddEffect('PARRY', 2);
        }

    }

    DoAI(Target)
    {
        if (this.Owner.Combo >= this.Owner.Moves["Behead"].Combo ) {
            this.AttackTarget(Target, this.Owner.Moves["Behead"]);
        } else if (this.Owner.Combo >= this.Owner.Moves["Cleave"].Combo && Math.floor(Math.random()* 100) >= 60) {
            this.AttackTarget(Target, this.Owner.Moves["Cleave"]);
        } else if (this.Owner.Combo >= this.Owner.Moves["Riposte"].Combo && this.LastMove == 'Parry') {
            this.AttackTarget(Target, this.Owner.Moves["Riposte"]);
        } else if (Math.floor(Math.random() * 100) >= 80) {
            this.AttackTarget(Target, this.Owner.Moves['Parry']);
        } else if (this.LastMove == "Stab") {
            this.AttackTarget(Target, this.Owner.Moves["Stab"]);
        } else {
            this.AttackTarget(Target, this.Owner.Moves["Slash"]);
        }
    }    
};

//Boob-jitsu Class
App.Combat.Engines.Boobjitsu = class BoobjitsuCombatEngine extends App.Combat.Engines.Generic {

    constructor(...args)
    {
        super(...args);
    }

    get Class() { return "BOOBJITSU"; }
};

//Ass-fu Class
App.Combat.Engines.Assfu = class AssfuCombatEngine extends App.Combat.Engines.Generic {

    constructor(...args)
    {
        super(...args);
    }

    get Class() { return "ASSFU"; }
};