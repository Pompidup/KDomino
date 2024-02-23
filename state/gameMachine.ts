import { Player } from "../src/domain/entities/game";
import { createMachine, assign, createActor } from "xstate";

export const machine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QQPYFsCWA7FcDiAhmmAHQDKYALgK4AOJAklhpQMQCCAIpwPoAKAGXYBNAKIAlMgG0ADAF1EoWilgsMKLIpAAPRAGYATAFYSANlPGDARlMzTAdgAsVq-YA0IAJ6IDADiskVnqOegCcpkYyoaEG9qEAvvEeqJg4+ESkFDT0fAA2BJ5gAE6wHNw84gCqAqLS8lrKqpTqmkg6iPbBZnr2RkaOMZFGvR7eCH4BQSHhkdGxCUkgKdi4sITE5FR0JOLUuXCsZAAq7OJHPHjsALKisgptjWoaWroIVgaGJMOzH0a+kY4DKMfP5AsEwhEojE4vZEsl0Ct0hsyJQCEVKOswIcTmceEdKuIAHJ3BoqJ6tUCvGy+PRfSJBUzBIwfdxeEGTcEzKHzOFLBFpNYZEh5ApHahFLAkThFAgAd04-NWh1E53xRJJDzJzWebVeelMvhIxhkJuGeisoSZwLeVl8jhI9isRgcpkcDlcsV5ywFmOF+U8Yolm2ygawrEEIh4ADEGJJVQTifVNU0Wi8OibAv5YoYrCbHPYgWy3gYZPaWX0DDFQnErF7FUjSCKA+LJVk6KHw0JhHiExqlFrU7r0zJM+9OtY8wXrbnzSQs-1OvZfKW-HXUqtfU3QyRQ1ZwwwAMIAaT7IEe2op7RtTodvTsxtCtoMpmnJbLPQrVZra8Rgo2W5bEgAHlKAAC2KUNSgjA9biTfsUx1SlEBcG97DvCxZifF8i1zRwTHdGI9H6C19UcH8fSFACgxA8Cikg8N2DIOp7ng8k02vEw0MiDCoiw61QhkQ1+jsV17HMAxnwWeF1wbP1RUAvgMAAYwAawVGTSlEQleDVRMWLPAdEKvaxbAdfxSLdZ9HH+adbVpXxfA+EIgj0GlonIjdKP9bcRSUsB1N-fdj1Pc9ByQt5TAEr4718OIIjtbCxlw-DHUI4jLVdDzZKoyU+AIWBNO0nt1TggyEMvV4TJHJcGUcSzXRsosBKExwRPzcTYlrRZvU8jZRCwCAO0JUQAA14xK-TQqM14LGtRl8NtNCMP+ZkyO6+s-1IfrBpbVgtN4S4bhCwyKsQZlpyMMIzFag06sMatK0SRYcAgOAtB6htSXK9iAFoDEca0-tpaIQdB0HfFMLLNuDOgvrYodxgBotGTMO8ghifwHPeKHfTbegmBYOGL3Yqci3+gJIhNW0YjqpccaFPG5MKEoibCq8BlpSmZB6Bw9DsfxEp8PwvnvSLXWZUI+np5EtnoXZ9ngZN4fChzaVzRknUrPpXNCa1rBMIx3mZbnzBcPmjGlzJUXRTFWem5CwgMOdnX1HX9TE3WyecEWqd8Gn818S2mdDO3ToQAZrU6Uw6RNPw7CiYYDCDnKpRleUNtD9jq1svCSEE95Qgc-wCz0ZPvMAvGQ6V4mEaGEhnMkiS9CIu0c5MfPKyLj1S-WjTN3LoNd0zhGBICc1jBCIvYki2zQSMASXX+mRDessv5OosCIJbRXWJrlXwjnE1SxsS04kE6cTVCQIIgcfnYvMHvpN-fv19y5S1Iz6u2apJd7Dzo3ojLycsYHOZZ8wzH6DSP2Uk+R9y8q-OSfkAoCmHuFd4z4jSWkckuPmNgZBWAvnYPOH48KSwaplXuz94HNiDHlAqqCrxBEEnOYIdUIbmE6Oaa0ENDQLz8I6ZcaFYSUIon1AaVdd7fx8HzEczoi4yBLE4GkrIxhFxIGEHoDkZAeyGEHbatsv72zeKEe0y4LCMnCK5GkrgLqoTdJaQwHxYrCMSEAA */
    id: "dominoesGame",
    initial: "Setup",
    states: {
      Setup: {
        description:
          "Initial setup of the game, including loading dominoes, setting players, and choosing rules.",
        initial: "Init",
        states: {
          Init: {
            description: "Load the dominoes into the game.",
            entry: [{ type: "loadDominoes" }],
            on: {
              ADD_PLAYERS: "Players",
            },
          },
          Players: {
            description: "Set up the players for the game.",
            entry: [{ type: "createPlayers" }, { type: "createKingdoms" }],
            on: {
              ADD_RULES: "Rules",
            },
          },
          Rules: {
            description: "Choose the set of rules to use for the game.",
            entry: ["chooseOptionalsRules", "applyRules", "cutDominoes"],
            on: {
              START_GAME: "#dominoesGame.StartGame",
            },
          },
        },
      },
      StartGame: {
        description: "Start the game by setting players' order.",
        entry: "setPlayersOrder",
        on: {
          START_TURN: "PlayTurn",
        },
      },
      PlayTurn: {
        description: "The main phase of the game where players take turns.",
        initial: "DrawDominoes",
        states: {
          DrawDominoes: {
            description: "Players draw dominoes from the pile.",
            entry: "drawDominoes",
            on: {
              SET_TURN: "SetupTurn",
            },
          },
          SetupTurn: {
            description: "Setup the current turn.",
            on: {
              PLAY_FIRST_TURN: "Turn1",
              PLAY_TURN: "OtherTurns",
            },
            entry: "setupTurns",
          },
          Turn1: {
            description: "The first turn of the game.",
            on: {
              PICK: "PickDominoes",
            },
          },
          OtherTurns: {
            description: "The turns after the first turn.",
            on: {
              PLACE: "PlaceDominoes",
              PASS: "Pass",
            },
          },
          PickDominoes: {
            description: "The phase where players pick dominoes to play.",
            entry: "pickDomino",
            on: {
              END_TURN: "#dominoesGame.EndTurn",
            },
          },
          PlaceDominoes: {
            description:
              "The phase where players place their chosen dominoes on the board.",
            entry: "placeDomino",
            on: {
              PICK: "PickDominoes",
            },
          },
          Pass: {
            description: "The phase where players pass their turn.",
            entry: "pass",
            on: {
              END_TURN: "#dominoesGame.EndTurn",
            },
          },
        },
      },
      EndTurn: {
        description:
          "End the current turn and check if the game should continue or end.",
        on: {
          NEXT_TURN: "PlayTurn",
          END_GAME: "EndGame",
        },
      },
      EndGame: {
        description:
          "The final state of the game indicating that the game has ended.",
        type: "final",
      },
    },
  },
  {
    actions: {
      loadDominoes: () => {
        console.log("Loading dominoes...");
      },
      createPlayers: (context) => {
        console.log("Creating players...");
        console.log("*******event", context.event);
        console.log("********context", context);
      },
      createKingdoms: () => {
        console.log("Creating kingdoms...");
      },
      chooseOptionalsRules: () => {
        console.log("Choosing optional rules...");
      },
      applyRules: () => {
        console.log("Applying rules...");
      },
      cutDominoes: () => {
        console.log("Cutting dominoes...");
      },
      setPlayersOrder: () => {
        console.log("Setting players order...");
      },
      drawDominoes: () => {
        console.log("Drawing dominoes...");
      },
      setupTurns: () => {
        console.log("Setting up turns...");
      },
      pickDomino: () => {
        console.log("Picking domino...");
      },
      placeDomino: () => {
        console.log("Placing domino...");
      },
      pass: () => {
        console.log("Passing...");
      },
    },
  }
);
