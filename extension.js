var usage = false;

export default {
    onload: ({ extensionAPI }) => {
        const config = {
            tabTitle: "Word of the Day",
            settings: [
                {
                    id: "wotd-APIKey",
                    name: "Wordnik API Key",
                    description: "Your API Key for Wordnik from your dashboard at https://www.wordnik.com/users/{username}/API",
                    action: { type: "input", placeholder: "Add Wordnik API key here" },
                },
                {
                    id: "wotd-examples",
                    name: "Include examples",
                    description: "Include examples of usage for the word of the day",
                    action: {
                        type: "switch",
                        onChange: (evt) => { setUsage(evt); }
                    },
                },
            ]
        };
        extensionAPI.settings.panel.create(config);

        // show alert about change to new API, but only do it once
        if (extensionAPI.settings.get("wotd-upgrade-alert") != true) {
            alert("Please note that the 'Word of the Day' extension has been updated to use an alternative API. Please update your API token as shown in Roam Depot settings!");
            extensionAPI.settings.set("wotd-upgrade-alert", true);
        }
        // onload
        if (extensionAPI.settings.get("wotd-examples") == true) {
            usage = true;
        }
        // onchange
        async function setUsage(evt) {
            if (evt.target.checked) {
                usage = true;
            } else {
                usage = false;
            }
        }

        extensionAPI.ui.commandPalette.addCommand({
            label: "Word of the Day",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing the Word of the Day");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWOTD().then(async (blocks) => {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });

                    var thisBlock = window.roamAlphaAPI.util.generateUID();
                    await window.roamAlphaAPI.createBlock({
                        location: { "parent-uid": uid, order: 1 },
                        block: { string: blocks[0].children[0].text.toString(), uid: thisBlock }
                    });
                    if (blocks[0].children.length > 1) {
                        var thisBlock1 = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: 2 },
                            block: { string: blocks[0].children[1].text.toString(), uid: thisBlock1 }
                        });
                    }
                });
                
                document.querySelector("body")?.click();
            },
        });

        const args = {
            text: "WOTD",
            help: "Word of the Day",
            handler: (context) => fetchWOTD,
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args)
            );
        }

        async function fetchWOTD() {
            var APIkey, key;

            breakme: {
                if (!extensionAPI.settings.get("wotd-APIKey")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else {
                    APIkey = extensionAPI.settings.get("wotd-APIKey");
                }

                var response = await fetch("https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=" + APIkey);
                if (response.ok) {
                    let data = await response.json();

                    var headerString = "**Word of the Day:**";
                    var output = [];
                    var string = "__";

                    string += data.word;
                    string += "__\n\n";

                    for (var i = 0; i < data.definitions.length; i++) {
                        var numb = parseInt(i) + 1;
                        string += "" + numb + ". " + data.definitions[i].text + "\n"
                    }
                    output.push({ "text": string, });

                    if (usage) {
                        var exampleString = "";
                        exampleString += "Usage Examples:\n\n";
                        for (var j = 0; j < data.examples.length; j++) {
                            var numb = parseInt(j) + 1;
                            exampleString += "" + numb + ". [" + data.examples[j].title + "]("+ data.examples[j].url + ")\n";
                            exampleString += "" + data.examples[j].text + "\n\n";
                        }                        
                        output.push({ "text": exampleString, });
                    }

                    return [
                        {
                            "text": headerString,
                            "children": output,
                        }
                    ];
                } else {
                    console.error(response);
                    alert("The call to the Wordnik API failed!");
                    if (uid != undefined) {
                        await window.roamAlphaAPI.deleteBlock({ "block": { "uid": uid } });
                    }
                }
            }
        }
    },
    onunload: () => {
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("WOTD");
        };
    }
}

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please set your API Key in the configuration settings via the Roam Depot tab.");
    }
}