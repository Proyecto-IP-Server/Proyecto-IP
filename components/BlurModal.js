import { Modal, Animated, View, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";

/**
 * Componente reutilizable de Modal con fondo semi-transparente y animación slide
 *
 * @param {boolean} visible - Controla si el modal está visible
 * @param {React.ReactNode} children - Contenido del modal
 * @param {Function} onClose - Función opcional para cerrar el modal
 * @param {number} slideDistance - Distancia inicial de la animación slide (por defecto 1000)
 * @param {object} containerStyle - Estilos adicionales para el contenedor del modal
 * @param {number} overlayOpacity - Opacidad del fondo oscuro (0-1, por defecto 0.75)
 * @param {string} overlayColor - Color del fondo (por defecto 'black')
 * @param {boolean} statusBarTranslucent - Si el modal debe ser translúcido en la barra de estado (por defecto true)
 * @param {boolean} fastAnimation - Usa animación rápida en lugar de spring (por defecto false)
 */
export default function BlurModal({
    visible,
    children,
    onClose,
    slideDistance = 1000,
    containerStyle = {},
    overlayOpacity = 0.75,
    overlayColor = "black",
    statusBarTranslucent = true,
    fastAnimation = false,
}) { 
    const slideAnim = useRef(new Animated.Value(slideDistance)).current;

    useEffect(() => {
        if (visible) {
            if (fastAnimation) {
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            } else {
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 40,
                    friction: 8,
                }).start();
            }
        } else {
        slideAnim.setValue(slideDistance);
        }
    }, [visible, slideAnim, slideDistance, fastAnimation]);

    return (
        <Modal
            statusBarTranslucent={statusBarTranslucent}
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            hardwareAccelerated={true}
            presentationStyle="overFullScreen"
        >
            <View style={[
                styles.modalOverlay,
                { backgroundColor: `rgba(${overlayColor === 'black' ? '0, 0, 0' : '255, 255, 255'}, ${overlayOpacity})` }
            ]}>
                <Animated.View
                    style={[
                        styles.modalContent,
                        containerStyle,
                        {
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        elevation: 10,
    },
    modalContent: {
        elevation: 20,
        zIndex: 10000,
    },
});
