import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RichTextEditor = ({ 
  value = '', 
  onChangeText, 
  placeholder = 'Tapez votre texte...',
  style = {} 
}) => {
  const [currentStyles, setCurrentStyles] = useState({
    bold: false,
    italic: false,
    color: '#000000'
  });
  
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [textSegments, setTextSegments] = useState([
    { text: value, styles: { bold: false, italic: false, color: '#000000' } }
  ]);
  
  const textInputRef = useRef(null);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#008000', '#800000', '#808080'
  ];

  // Fonction pour appliquer/retirer le gras
  const toggleBold = () => {
    setCurrentStyles(prev => ({
      ...prev,
      bold: !prev.bold
    }));
  };

  // Fonction pour appliquer/retirer l'italique
  const toggleItalic = () => {
    setCurrentStyles(prev => ({
      ...prev,
      italic: !prev.italic
    }));
  };

  // Fonction pour changer la couleur
  const changeColor = (color) => {
    setCurrentStyles(prev => ({
      ...prev,
      color: color
    }));
  };

  // Fonction pour appliquer les styles au texte sélectionné
  const applyStylesToSelection = () => {
    if (selection.start === selection.end) {
      Alert.alert('Info', 'Veuillez sélectionner du texte pour appliquer les styles');
      return;
    }

    const newSegments = [];
    let currentPosition = 0;

    // Parcourir les segments existants
    for (let segment of textSegments) {
      const segmentEnd = currentPosition + segment.text.length;

      // Segment avant la sélection
      if (currentPosition < selection.start && selection.start < segmentEnd) {
        const beforeText = segment.text.substring(0, selection.start - currentPosition);
        if (beforeText.length > 0) {
          newSegments.push({ text: beforeText, styles: segment.styles });
        }
      }

      // Segment dans la sélection
      if (currentPosition < selection.end && selection.start < segmentEnd) {
        const start = Math.max(0, selection.start - currentPosition);
        const end = Math.min(segment.text.length, selection.end - currentPosition);
        const selectedText = segment.text.substring(start, end);
        
        if (selectedText.length > 0) {
          newSegments.push({ 
            text: selectedText, 
            styles: { ...currentStyles } // Appliquer les nouveaux styles
          });
        }
      }

      // Segment après la sélection
      if (selection.end < segmentEnd) {
        const afterText = segment.text.substring(selection.end - currentPosition);
        if (afterText.length > 0) {
          newSegments.push({ text: afterText, styles: segment.styles });
        }
      }

      // Segment complètement avant ou après la sélection
      if (segmentEnd <= selection.start || currentPosition >= selection.end) {
        newSegments.push(segment);
      }

      currentPosition = segmentEnd;
    }

    setTextSegments(newSegments);
    
    // Reconstruire le texte complet
    const fullText = newSegments.map(seg => seg.text).join('');
    onChangeText && onChangeText(fullText);
  };

  // Fonction pour obtenir le style d'un segment
  const getSegmentStyle = (styles) => {
    return {
      fontWeight: styles.bold ? 'bold' : 'normal',
      fontStyle: styles.italic ? 'italic' : 'normal',
      color: styles.color
    };
  };

  // Rendu du texte avec styles
  const renderStyledText = () => {
    return textSegments.map((segment, index) => (
      <Text key={index} style={getSegmentStyle(segment.styles)}>
        {segment.text}
      </Text>
    ));
  };

  return (
    <View style={[styles.container, style]}>
      {/* Barre d'outils */}
      <View style={styles.toolbar}>
        {/* Bouton Gras */}
        <TouchableOpacity
          style={[styles.toolButton, currentStyles.bold && styles.activeButton]}
          onPress={toggleBold}
        >
          <Text style={[styles.toolButtonText, currentStyles.bold && styles.activeButtonText]}>
            B
          </Text>
        </TouchableOpacity>

        {/* Bouton Italique */}
        <TouchableOpacity
          style={[styles.toolButton, currentStyles.italic && styles.activeButton]}
          onPress={toggleItalic}
        >
          <Text style={[styles.toolButtonText, { fontStyle: 'italic' }, currentStyles.italic && styles.activeButtonText]}>
            I
          </Text>
        </TouchableOpacity>

        {/* Séparateur */}
        <View style={styles.separator} />

        {/* Palette de couleurs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPalette}>
          {colors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                currentStyles.color === color && styles.selectedColor
              ]}
              onPress={() => changeColor(color)}
            />
          ))}
        </ScrollView>

        {/* Bouton Appliquer */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={applyStylesToSelection}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Zone de texte */}
      <View style={styles.textContainer}>
        {/* Zone d'affichage du texte stylé */}
        <ScrollView style={styles.styledTextDisplay}>
          <Text style={styles.styledText}>
            {renderStyledText()}
          </Text>
        </ScrollView>

        {/* Zone de saisie invisible pour la sélection */}
        <TextInput
          ref={textInputRef}
          style={styles.hiddenInput}
          value={value}
          onChangeText={(text) => {
            // Mettre à jour les segments avec le nouveau texte
            setTextSegments([{ text, styles: currentStyles }]);
            onChangeText && onChangeText(text);
          }}
          onSelectionChange={(event) => {
            setSelection(event.nativeEvent.selection);
          }}
          multiline
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
      </View>

      {/* Indicateur des styles actuels */}
      <View style={styles.styleIndicator}>
        <Text style={styles.indicatorText}>
          Styles actifs: 
          {currentStyles.bold && ' Gras'}
          {currentStyles.italic && ' Italique'}
          <Text style={{ color: currentStyles.color }}> ●</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  toolButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  toolButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activeButtonText: {
    color: '#fff',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  colorPalette: {
    flexDirection: 'row',
    maxWidth: 150,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
    borderWidth: 3,
  },
  applyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  textContainer: {
    minHeight: 150,
    position: 'relative',
  },
  styledTextDisplay: {
    padding: 15,
    minHeight: 150,
  },
  styledText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01, // Presque invisible mais toujours interactif
    padding: 15,
    fontSize: 16,
    lineHeight: 24,
  },
  styleIndicator: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  indicatorText: {
    fontSize: 12,
    color: '#666',
  },
});

export default RichTextEditor;