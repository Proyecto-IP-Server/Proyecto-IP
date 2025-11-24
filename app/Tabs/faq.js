import { Pressable, View, Text, StyleSheet, ScrollView, TextInput, Linking, SafeAreaView, TouchableOpacity } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';

// --- Constantes de Estilo para el Tono Amigable ---
const PRIMARY_COLOR = '#007AFF'; // Azul
const ACCENT_COLOR = '#4CAF50'; // Verde

// --- Componente: Botón de Regresar a Home (NUEVO) ---
const HeaderButton = ({ router }) => (
    <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/Tabs/home')}
    >
        <Text style={styles.backButtonText}>🏠 Home</Text>
    </TouchableOpacity>
);

// --- Datos para el Dropdown ---
const categoryData = [
    { label: 'Todas las Categorías', value: 'Todos' },
    { label: '💡 Uso Básico', value: 'Uso General' },
    { label: '🔑 Mi Cuenta', value: 'Cuenta' },
    { label: '⭐ Funciones Chidas', value: 'Funcionalidades' },
    { label: '🚨 Ayuda y Reportes', value: 'Soporte' },
    { label: '🔒 Reglas y Privacidad', value: 'Privacidad' }, 
];

// --- 1. Datos de las Preguntas Frecuentes ---
const faqData = [
    // --- 🔑 Mi Cuenta (¡Entra Rápido!) ---
    { 
        id: '1', 
        category: 'Cuenta', 
        question: '¿Cómo entro a la app por primera vez?', 
        answer: '¡Fácil! Usa tu **correo institucional**. Te mandaremos un código secreto 🤫 al instante para que inicies sesión o te registres. ¡No hay contraseñas raras!' 
    },
    { 
        id: '2', 
        category: 'Cuenta', 
        question: 'Me registré, pero no veo el código, ¿qué onda?', 
        answer: 'Tranquilo/a. Checa tu bandeja de **spam** o correo no deseado. Si aún no lo encuentras, confirma que usaste tu **correo de la uni** y pide que te reenvíen el código. ¡A veces se esconde! 🧐' 
    },
    // --- 💡 Uso Básico (Para Empezar) ---
    { 
        id: '4', 
        category: 'Uso General', 
        question: '¿Qué puedo hacer aquí en general?', 
        answer: 'Puedes **buscar** 🔎 dónde comer o estudiar, **guardar** tus lugares favoritos y **dejar reseñas** ⭐️. Además, ¡puedes ver todo lo que has hecho en tu historial!' 
    },
    
    
    { 
        id: '7', 
        category: 'Uso General', 
        question: '¿La app sirve si no tengo internet (sin datos)?', 
        answer: 'Necesitas conexión para buscar cosas nuevas y subir tus reseñas. Pero los lugares que ya viste o guardaste estarán disponibles para leerlos por un rato, ¡por si acaso!' 
    },
    { 
        id: '8', 
        category: 'Uso General', 
        question: 'Subí una foto/reseña y no sale en mi perfil, ¿ya la perdí?', 
        answer: '¡No! La reseña sale al instante en la página del lugar. Tu historial personal se actualiza cada **10 minutos** para que la app no se ponga lenta. Dale un chance.' 
    },
    // --- ⭐ Dejar Reseñas y Funciones Chidas ---
    { 
        id: '9', 
        category: 'Funcionalidades', 
        question: '¿Cómo pongo mi calificación o reseña?', 
        answer: 'En la página del local, busca el botón **"Dejar Reseña"**. Elige tus estrellas y escribe tu opinión. ¡Sé útil con los demás estudiantes!' 
    },
    { 
        id: '10', 
        category: 'Funcionalidades', 
        question: 'Me equivoqué, ¿puedo cambiar o borrar mi reseña?', 
        answer: 'Claro. Ve a tu "Perfil", busca la reseña y ahí verás la opción **"Editar"** o **"Eliminar"** desde el menú de la reseña.' 
    },
    { 
        id: '11', 
        category: 'Funcionalidades', 
        question: '¿Cómo guardo un lugar que quiero visitar después (como una "lista de pendientes")?', 
        answer: 'Usa la **Lista de Seguimiento** (o *Pendientes*). En la página del local, toca el ícono de la **bandera** (🚩) o el marcador. ¡Así no se te olvida!' 
    },
    { 
        id: '12', 
        category: 'Funcionalidades', 
        question: '¿Qué significa el puntaje de estrellas del lugar?', 
        answer: 'Es el **promedio de TODAS las calificaciones** que han dejado los estudiantes. Más estrellas = mejor experiencia, según la comunidad. 💯' 
    },
    { 
        id: '13', 
        category: 'Funcionalidades', 
        question: '¿Puedo subir fotos a mis reseñas?', 
        answer: '¡Sí! Al hacer o editar la reseña, puedes subir hasta **5 fotos**. Solo asegúrate que sean fotos claras y que ayuden a describir el lugar.' 
    },
    { 
        id: '14', 
        category: 'Funcionalidades', 
        question: '¿Qué formato deben tener mis fotos (tamaño, tipo)?', 
        answer: 'Usa **JPG o PNG**. El límite es de **5MB** por foto. Si es más grande, la app la hará más pequeña automáticamente.' 
    },
    // --- 🚨 Ayuda y Reportes ---
    { 
        id: '16', 
        category: 'Soporte', 
        question: '¿Cómo contacto al equipo de soporte técnico?', 
        answer: (router) => (
            <View>
                <Text style={faqStyles.answerText}>
                    Si tu duda no se resolvió aquí, puedes usar el formulario de contacto directo o escribirnos un correo.
                </Text>
                <Pressable 
                    style={styles.helpButton} 
                    onPress={() => router.push('/Tabs/support')}
                >
                    <Text style={styles.helpButtonText}>
                        🚨 Ir a Ayuda y Soporte 🚨
                    </Text>
                </Pressable>
                <Text style={faqStyles.answerTextSmall}>
                    También puedes escribirnos a: mihorarioudg@gmail.com
                </Text>
            </View>
        )
    },
    // --- 🔒 Privacidad y Reglas ---
    { 
        id: '17', 
        category: 'Privacidad', 
        question: '¿Qué hacen con mis datos y mis reseñas?', 
        answer: 'Tus datos se usan solo para que la app funcione mejor para ti. Tus reseñas son públicas, pero puedes ser anónimo/a si quieres. Revisa la **Política de Privacidad** en "Configuración".' 
    },
    { 
        id: '18', 
        category: 'Privacidad', 
        question: '¿Qué cosas NO debo poner en mis reseñas (contenido prohibido)?', 
        answer: 'Sé buena onda. Prohibido: **insultos, acoso, contenido ilegal, spam** y publicar **datos personales de otros**. ¡Respeto ante todo!' 
    },
];


// --- 2. Componente de Ítem Individual del FAQ ---
const FAQItem = ({ question, answer, router }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderAnswer = typeof answer === 'function' ? answer(router) : (
        <Text style={faqStyles.answerText}>
            {answer}
        </Text>
    );

    return (
        <View style={faqStyles.itemContainer}>
            <Pressable 
                onPress={() => setIsExpanded(!isExpanded)} 
                style={faqStyles.questionButton}
            >
                <Text style={faqStyles.questionText}>{question}</Text>
                <Text style={faqStyles.icon}>
                    {isExpanded ? '▲' : '▼'}
                </Text>
            </Pressable>
            
            {isExpanded && (
                <View style={faqStyles.answerContainer}>
                    {renderAnswer} 
                </View>
            )}
        </View>
    );
};

// --- 3. Componente Principal FAQ (Estructura con botón de regreso) ---
export default function FAQ() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('Todos'); 
    const [searchText, setSearchText] = useState(''); 

    const filteredFaqs = useMemo(() => {
        let results = faqData;
        if (selectedCategory !== 'Todos') {
            const categoryMap = {
                'Mi Cuenta': 'Cuenta',
                'Uso Básico': 'Uso General',
                'Funciones Chidas': 'Funcionalidades',
                'Ayuda y Reportes': 'Soporte',
                'Reglas y Privacidad': 'Privacidad'
            };
            const actualCategory = categoryMap[selectedCategory] || selectedCategory;

            results = results.filter(item => item.category === actualCategory);
        }
        
        if (searchText.trim() !== '') {
            const lowercasedSearch = searchText.toLowerCase().trim();
            results = results.filter(item => 
                item.question.toLowerCase().includes(lowercasedSearch) ||
                (typeof item.answer === 'string' && item.answer.toLowerCase().includes(lowercasedSearch))
            );
        }
        return results;
    }, [selectedCategory, searchText]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#EAEAEA' }}>
            {/* Contenedor del Botón de Regreso y Título */}
            <View style={styles.headerContainer}>
                <HeaderButton router={router} />
                <Text style={styles.mainTitle}> PREGUNTAS FRECUENTES (FAQ)</Text>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.introText}>
                    ¡Relájate! Aquí te explicamos **fácil y rápido** cómo usar la app. ¡Pregunta lo que sea! 👇
                </Text>

                <TextInput
                    style={styles.searchInput}
                    placeholder="🔎 Busca algo rápido (ej. 'código', 'foto', 'soporte')"
                    placeholderTextColor="#A0A0A0"
                    value={searchText}
                    onChangeText={setSearchText}
                />

                <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={categoryData}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="🚀 Filtra por tema (¡lo más fácil!)"
                    value={selectedCategory}
                    onChange={item => {
                        const cleanValue = item.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ\s]/g, '').trim(); 
                        setSelectedCategory(cleanValue);
                    }}
                />
                
                <ScrollView style={styles.scrollView}>
                    {filteredFaqs.map(item => (
                        <FAQItem 
                            key={item.id} 
                            question={item.question} 
                            answer={item.answer} 
                            router={router} 
                        />
                    ))}
                    {filteredFaqs.length === 0 && (
                        <Text style={styles.noResultsText}>
                            ¡Ups! No encontramos nada con eso. Intenta con otra palabra. 🤔
                        </Text>
                    )}
                </ScrollView>
                
                {/* ❌ BOTÓN DE "VER RESEÑAS" ELIMINADO COMPLETAMENTE ❌ */}

            </View>
        </SafeAreaView>
    );
}

// --- 4. Estilos (Ajustados para el nuevo Header) ---
const faqStyles = StyleSheet.create({
    itemContainer: {
        width: '100%',
        marginVertical: 8, 
        backgroundColor: '#fff',
        borderRadius: 12, 
        overflow: 'hidden',
        borderLeftWidth: 6, 
        borderLeftColor: PRIMARY_COLOR, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 5.46,
        elevation: 8,
    },
    questionButton: {
        padding: 18, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff', 
    },
    questionText: {
        fontSize: 17, 
        fontWeight: '700', 
        color: '#333',
        flexShrink: 1,
    },
    icon: {
        fontSize: 16, 
        fontWeight: 'bold',
        marginLeft: 10,
        color: PRIMARY_COLOR, 
    },
    answerContainer: {
        padding: 18,
        paddingTop: 0,
        backgroundColor: '#F7F7F7', 
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    answerText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 24, 
        marginBottom: 10, 
    },
    answerTextSmall: {
        fontSize: 13,
        color: '#888',
        marginTop: 5,
        lineHeight: 20, 
    }
});

const styles = StyleSheet.create({
    // Contenedor principal para SafeAreaView
    container:{
        flex: 1,
        width:'100%',
        backgroundColor: '#EAEAEA', 
    },
    // Contenedor que sostiene el resto de los elementos (Search, Dropdown, ScrollView)
    contentContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10, // Menos padding aquí porque el título ya tiene el suyo
        alignItems: 'center',
    },
    // Contenedor del encabezado para alinear el botón y el título
    headerContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#EAEAEA',
        position: 'relative',
    },
    // NUEVO: Botón de regresar a Home (arriba a la izquierda)
    backButton: {
        position: 'absolute',
        left: 20,
        top: 25,
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    backButtonText: {
        color: PRIMARY_COLOR,
        fontWeight: '700',
        fontSize: 15,
    },
    mainTitle: { 
        fontSize: 24,
        fontWeight: '900',
        color: PRIMARY_COLOR,
        textAlign: 'center',
    },
    introText: {
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 10,
        fontSize: 16,
        fontWeight: '500',
        color: '#6c757d',
    },
    searchInput: {
        width: '100%',
        height: 55,
        borderColor: PRIMARY_COLOR,
        borderWidth: 2, 
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15, 
        backgroundColor: 'white',
        fontSize: 17,
    },
    dropdown: {
        width: '100%',
        height: 55,
        borderColor: PRIMARY_COLOR,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: 'white',
    },
    placeholderStyle: {
        fontSize: 17,
        color: PRIMARY_COLOR, 
        fontWeight: '600',
    },
    selectedTextStyle: {
        fontSize: 17,
        color: '#333',
        fontWeight: '600',
    },
    scrollView: {
        width: '100%',
        flex: 1,
        marginBottom: 20,
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#999',
    },
    helpButton: {
        backgroundColor: PRIMARY_COLOR, 
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5,
    },
    helpButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
});