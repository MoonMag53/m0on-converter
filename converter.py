import xml.etree.ElementTree as ET
import json
import os

class VoiceCommandsConverter:
    
    def __init__(self, log_func=None):
        self.log = log_func or print
        self.sound_map = {
            "Есть.wav": "Voices/Подтверждение_Ответ/Есть.WAV",
            "Да сэр.wav": "Voices/Подтверждение_Ответ/Да, сэр.WAV",
            "Да сэр(второй).wav": "Voices/Подтверждение_Ответ/Да, сэр (второй).WAV",
            "Загружаю сэр.wav": "Voices/Запуск_Действие/Загружаю, сэр.WAV",
            "Как пожелаете .wav": "Voices/Подтверждение_Ответ/Как пожелаете.WAV",
            "Запрос выполнен сэр.wav": "Voices/Подтверждение_Ответ/Запрос выполнен, сэр.WAV",
            "Всегда к вашим услугам сэр.wav": "Voices/Вежливое общение/Всегда к вашим услугам, сэр.WAV",
            "К вашим услугам сэр.wav": "Voices/Вежливое общение/К вашим услугам, сэр.WAV",
            "Вы создали новый элемент.wav": "Voices/Запуск_Действие/Вы создали новый элемент.WAV",
            "Джарвис - приветствие.wav": "Voices/Приветствия/Джарвис - приветствие.WAV",
            "Доброе утро.wav": "Voices/Приветствия/Доброе утро, сэр.WAV",
            "Отключаю питание, начинаю диагностику системы.wav": "Voices/Система/Отключаю питание.WAV",
            "Импортирую установки, начинаю калибровку виртуальной среды.wav": "Voices/Система/Импортирую установки.WAV",
            "Сохранить его в центральной базе данных Stark Industries.wav": "Voices/Система/Сохраняю в базу данных.WAV",
        }
    
    def convert_xml_to_json(self, xml_path):
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        result = {
            "type": "collection",
            "name": "Конвертированные команды",
            "description": "",
            "isEnabled": True,
            "activationPhrases": [],
            "children": []
        }
        
        for group_collection in root.findall(".//groupCollection"):
            for command_group in group_collection.findall("commandGroup"):
                if command_group.get("enabled") != "True":
                    continue
                
                folder = {
                    "type": "folder",
                    "name": command_group.get("name", "Без названия"),
                    "description": "",
                    "isEnabled": True,
                    "activationPhrases": [],
                    "children": []
                }
                
                for command in command_group.findall("command"):
                    if command.get("enabled") != "true":
                        continue
                    
                    phrases = []
                    optional = []
                    
                    for phrase in command.findall("phrase"):
                        text = phrase.text or ""
                        parts = [p.strip() for p in text.split(",") if p.strip()]
                        
                        if phrase.get("optional") == "true":
                            optional.extend(parts)
                        else:
                            phrases.extend(parts)
                    
                    if not phrases:
                        continue
                    
                    cmd = {
                        "type": "command",
                        "name": command.get("name", ""),
                        "description": "",
                        "isEnabled": True,
                        "activationPhrases": phrases,
                        "optionalPhrases": optional,
                        "requiresConfirmation": command.get("confirm") == "True",
                        "chainEnabled": True,
                        "sequence": []
                    }
                    
                    for action in command.findall("action"):
                        action_type = action.find("cmdType").text
                        params_elem = action.find("params")
                        params = []
                        
                        if params_elem is not None:
                            for param in params_elem.findall("param"):
                                if param.text:
                                    params.append(param.text)
                        
                        converted = self._convert_action(action_type, params)
                        if converted:
                            cmd["sequence"].append(converted)
                    
                    if cmd["sequence"]:
                        folder["children"].append(cmd)
                
                if folder["children"]:
                    result["children"].append(folder)
        
        return result
    
    def _convert_action(self, action_type, params):
        
        if action_type == "Sound.PlayStream":
            path = params[0] if params else ""
            sound_name = os.path.basename(path)
            for old, new in self.sound_map.items():
                if old.lower() in sound_name.lower() or sound_name.lower() in old.lower():
                    return f"Sound.PlayWav:{new}"
            return f"Sound.PlayWav:Voices/Other/{sound_name}"
        
        elif action_type == "Launch.OpenURL":
            return f"Launch.Url:{params[0] if params else ''}"
        
        elif action_type == "Launch.OpenFile":
            return f"Launch.File:{params[0] if params else ''}"
        
        elif action_type == "Window.Close":
            return "Key.Press:Alt+F4"
        
        elif action_type == "Window.Minimize":
            return "Key.Press:Win+Down"
        
        elif action_type == "Window.Maximize":
            return "Key.Press:Win+Up"
        
        elif action_type == "Window.Normalize":
            return "Key.Press:Win+Down"
        
        elif action_type == "InputKeys.Send":
            keys = params[0] if params else ""
            return self._convert_keys(keys)
        
        elif action_type == "Mouse.LeftClick":
            return "Mouse.ClickLeft"
        
        elif action_type == "System.Monitor.Off":
            return "System.MonitorOff"
        
        elif action_type == "System.Sleep":
            return "System.Sleep"
        
        elif action_type == "Sound.SetVol":
            return f"Sound.SetVolume:{params[0] if params else '50'}"
        
        elif action_type == "TTS.Speak":
            return f"TTS.Speak:{params[0] if params else ''}"
        
        elif action_type == "VC.Pause":
            return f"Wait:{params[0] if params else '1000'}"
        
        return None
    
    def _convert_keys(self, keys):
        keys = keys.replace("{", "").replace("}", "")
        keys = keys.replace("(", "").replace(")", "")
        
        map_keys = {
            "LCONTROL": "Ctrl", "CONTROL": "Ctrl",
            "LSHIFT": "Shift", "SHIFT": "Shift",
            "LALT": "Alt", "ALT": "Alt",
            "LWIN": "Win",
            "LEFT": "Left", "RIGHT": "Right",
            "UP": "Up", "DOWN": "Down",
            "ENTER": "Enter", "DELETE": "Delete",
            "HOME": "Home", "END": "End", "TAB": "Tab",
            "F1": "F1", "F2": "F2", "F3": "F3", "F4": "F4",
            "F5": "F5", "F12": "F12",
        }
        
        for old, new in map_keys.items():
            keys = keys.replace(old, new)
        
        parts = [p.strip() for p in keys.split("+") if p.strip()]
        return f"Key.Press:{'+'.join(parts)}"


def convert(xml_path):
    if not os.path.exists(xml_path):
        print(f"ОШИБКА: Файл {xml_path} не найден.")
        return

    try:
        converter = VoiceCommandsConverter()
        result = converter.convert_xml_to_json(xml_path)
        
        output_path = xml_path.replace(".xml", ".json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        print(f"УСПЕШНО: {output_path} сохранен.")

    except Exception as e:
        print(f"SYSTEM ERROR: {str(e)}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        convert(sys.argv[1])
    else:
        print("АРГУМЕНТЫ НЕ ПРИНЯТЫ")
