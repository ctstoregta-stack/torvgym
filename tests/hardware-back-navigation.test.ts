import { test } from "node:test";
import assert from "node:assert/strict";
import { getHardwareBackTarget } from "../src/lib/hardware-back-navigation.ts";

test("Android Back leva da biblioteca de exercícios ao Perfil", () => {
  assert.equal(getHardwareBackTarget("/exercicios"), "/perfil");
});

test("Android Back volta do detalhe à biblioteca de exercícios", () => {
  assert.equal(getHardwareBackTarget("/exercicio/agachamento"), "/exercicios");
});

test("telas secundárias e atalhos do Perfil retornam ao Perfil", () => {
  for (const path of ["/historico", "/conquistas", "/configuracoes", "/corpo", "/exercicios", "/progresso"]) {
    assert.equal(getHardwareBackTarget(path), "/perfil", `destino incorreto para ${path}`);
  }
});

test("relatórios retornam ao histórico", () => {
  assert.equal(getHardwareBackTarget("/relatorios"), "/historico");
});

test("abas principais retornam ao início", () => {
  assert.equal(getHardwareBackTarget("/rotinas"), "/");
  assert.equal(getHardwareBackTarget("/perfil"), "/");
});

test("tela de edição do treino retorna às rotinas", () => {
  assert.equal(getHardwareBackTarget("/treino/treino-a"), "/rotinas");
});

test("execução do treino volta ao resumo do treino sem encerrar a sessão", () => {
  assert.equal(getHardwareBackTarget("/executar/treino-a"), "/treino/treino-a");
});

test("na tela inicial, Back não encerra o app", () => {
  assert.equal(getHardwareBackTarget("/"), null);
});
