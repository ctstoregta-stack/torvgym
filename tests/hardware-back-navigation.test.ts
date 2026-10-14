import { test } from "node:test";
import assert from "node:assert/strict";
import { getHardwareBackTarget } from "../src/lib/hardware-back-navigation.ts";

test("Android Back leva da biblioteca de exercícios ao Perfil", () => {
  assert.equal(getHardwareBackTarget("/exercicios"), "/perfil");
});

test("Android Back volta do detalhe à biblioteca de exercícios", () => {
  assert.equal(getHardwareBackTarget("/exercicio/agachamento"), "/exercicios");
});

test("telas secundárias do Perfil retornam ao Perfil", () => {
  assert.equal(getHardwareBackTarget("/historico"), "/perfil");
  assert.equal(getHardwareBackTarget("/conquistas"), "/perfil");
});

test("execução do treino volta ao resumo do treino sem encerrar a sessão", () => {
  assert.equal(getHardwareBackTarget("/executar/treino-a"), "/treino/treino-a");
});

test("na tela inicial, Back não encerra o app", () => {
  assert.equal(getHardwareBackTarget("/"), null);
});
