#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─────────────────────────────────────────
// Configuración desde archivo externo
// Copiar config.h.example → config.h y ajustar valores
// ─────────────────────────────────────────
#include "config.h"

// ─────────────────────────────────────────
// Constantes derivadas de config.h
// ─────────────────────────────────────────
const char* wifi_ssid     = WIFI_SSID;
const char* wifi_password = WIFI_PASSWORD;
const char* mqtt_broker   = MQTT_BROKER;
const int   mqtt_port     = MQTT_PORT;
const char* mqtt_topic    = MQTT_TOPIC;
const char* device_id     = DEVICE_ID;
const float lat           = LAT;
const float lon           = LON;
const int   button_pin    = BUTTON_PIN;

// ─────────────────────────────────────────
// Variables de control
// ─────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

bool  lastButtonState = HIGH;  // pullup interno: HIGH = no presionado
unsigned long lastPublishTime = 0;
const unsigned long DEBOUNCE_MS = 300;  // evita múltiples envíos por un solo press

// Prototipos de funciones
void connectWiFi();
void connectMQTT();
void publishAlert();

// ─────────────────────────────────────────
// Setup
// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(button_pin, INPUT_PULLUP);

  connectWiFi();

  mqttClient.setServer(mqtt_broker, mqtt_port);
  mqttClient.setKeepAlive(60);
  mqttClient.setSocketTimeout(30);
  connectMQTT();
}

// ─────────────────────────────────────────
// Loop principal
// ─────────────────────────────────────────
void loop() {
  // Mantener conexión MQTT activa
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Leer botón
  bool currentState = digitalRead(button_pin);

  // Detectar flanco de bajada (HIGH → LOW = botón presionado)
  if (currentState == LOW && lastButtonState == HIGH) {
    unsigned long now = millis();
    if (now - lastPublishTime > DEBOUNCE_MS) {
      publishAlert();
      lastPublishTime = now;
    }
  }

  lastButtonState = currentState;
  delay(50);
}

// ─────────────────────────────────────────
// Publicar alerta al broker MQTT
// ─────────────────────────────────────────
void publishAlert() {
  StaticJsonDocument<256> doc;

  doc["device_id"]      = device_id;
  doc["lat"]            = lat;
  doc["lon"]            = lon;
  doc["timestamp"]      = millis() / 1000;  // segundos desde boot
  doc["emergency_type"] = "robo";
  doc["description"]    = "boton de panico activado";

  char payload[256];
  serializeJson(doc, payload);

  bool ok = mqttClient.publish(mqtt_topic, payload, false);

  if (ok) {
    Serial.println("✓ Alerta publicada:");
    Serial.println(payload);
  } else {
    Serial.println("✗ Error al publicar — verificar conexión MQTT");
  }
}

// ─────────────────────────────────────────
// Conexión WiFi
// ─────────────────────────────────────────
void connectWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(wifi_ssid);

  WiFi.begin(wifi_ssid, wifi_password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi conectado — IP: ");
  Serial.println(WiFi.localIP());
}

// ─────────────────────────────────────────
// Conexión MQTT con reintentos
// ─────────────────────────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Conectando a MQTT broker...");

    String clientId = String(device_id) + "-" + String(millis());

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" conectado");
    } else {
      Serial.print(" falló, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" — reintentando en 3s");
      delay(3000);
    }
  }
}
