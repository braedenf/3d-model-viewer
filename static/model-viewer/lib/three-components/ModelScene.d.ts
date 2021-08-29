import { Box3, Camera, Event as ThreeEvent, Object3D, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import ModelViewerElementBase, { RendererInterface } from '../model-viewer-base.js';
import { ModelViewerGLTFInstance } from './gltf-instance/ModelViewerGLTFInstance.js';
import { Hotspot } from './Hotspot.js';
import { Shadow } from './Shadow.js';
export interface ModelLoadEvent extends ThreeEvent {
    url: string;
}
export interface ModelSceneConfig {
    element: ModelViewerElementBase;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}
export declare type IlluminationRole = 'primary' | 'secondary';
export declare const IlluminationRole: {
    [index: string]: IlluminationRole;
};
export declare const DEFAULT_FOV_DEG = 45;
export declare const SAFE_RADIUS_RATIO: number;
export declare const DEFAULT_TAN_FOV: number;
/**
 * A THREE.Scene object that takes a Model and CanvasHTMLElement and
 * constructs a framed scene based off of the canvas dimensions.
 * Provides lights and cameras to be used in a renderer.
 */
export declare class ModelScene extends Scene {
    element: ModelViewerElementBase;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | ImageBitmapRenderingContext | null;
    annotationRenderer: CSS2DRenderer;
    width: number;
    height: number;
    aspect: number;
    isDirty: boolean;
    renderCount: number;
    externalRenderer: RendererInterface | null;
    camera: PerspectiveCamera;
    xrCamera: Camera | null;
    url: string | null;
    target: Object3D;
    modelContainer: Object3D;
    animationNames: Array<string>;
    boundingBox: Box3;
    size: Vector3;
    idealCameraDistance: number;
    fieldOfViewAspect: number;
    framedFieldOfView: number;
    shadow: Shadow | null;
    shadowIntensity: number;
    shadowSoftness: number;
    exposure: number;
    canScale: boolean;
    tightBounds: boolean;
    private goalTarget;
    private targetDamperX;
    private targetDamperY;
    private targetDamperZ;
    private _currentGLTF;
    private mixer;
    private cancelPendingSourceChange;
    private animationsByName;
    private currentAnimationAction;
    constructor({ canvas, element, width, height }: ModelSceneConfig);
    /**
     * Function to create the context lazily, as when there is only one
     * <model-viewer> element, the renderer's 3D context can be displayed
     * directly. This extra context is necessary to copy the renderings into when
     * there are more than one.
     */
    createContext(): void;
    getCamera(): Camera;
    /**
     * Pass in a THREE.Object3D to be controlled
     * by this model.
     */
    setObject(model: Object3D): Promise<void>;
    /**
     * Sets the model via URL.
     */
    setSource(url: string | null, progressCallback?: (progress: number) => void): Promise<void>;
    private setupScene;
    reset(): void;
    get currentGLTF(): ModelViewerGLTFInstance | null;
    /**
     * Updates the ModelScene for a new container size in CSS pixels.
     */
    setSize(width: number, height: number): void;
    updateBoundingBox(): void;
    /**
     * Calculates the idealCameraDistance and fieldOfViewAspect that allows the 3D
     * object to be framed tightly in a 2D window of any aspect ratio without
     * clipping at any camera orbit. The camera's center target point can be
     * optionally specified. If no center is specified, it defaults to the center
     * of the bounding box, which means asymmetric models will tend to be tight on
     * one side instead of both. Proper choice of center can correct this.
     */
    updateFraming(center?: Vector3 | null): void;
    /**
     * Set's the framedFieldOfView based on the aspect ratio of the window in
     * order to keep the model fully visible at any camera orientation.
     */
    frameModel(): void;
    /**
     * Returns the size of the corresponding canvas element.
     */
    getSize(): {
        width: number;
        height: number;
    };
    /**
     * Sets the point in model coordinates the model should orbit/pivot around.
     */
    setTarget(modelX: number, modelY: number, modelZ: number): void;
    /**
     * Set the decay time of, affects the speed of target transitions.
     */
    setTargetDamperDecayTime(decayMilliseconds: number): void;
    /**
     * Gets the point in model coordinates the model should orbit/pivot around.
     */
    getTarget(): Vector3;
    /**
     * Shifts the model to the target point immediately instead of easing in.
     */
    jumpToGoal(): void;
    /**
     * This should be called every frame with the frame delta to cause the target
     * to transition to its set point.
     */
    updateTarget(delta: number): void;
    /**
     * Yaw the +z (front) of the model toward the indicated world coordinates.
     */
    pointTowards(worldX: number, worldZ: number): void;
    /**
     * Yaw is the scene's orientation about the y-axis, around the rotation
     * center.
     */
    set yaw(radiansY: number);
    get yaw(): number;
    set animationTime(value: number);
    get animationTime(): number;
    get duration(): number;
    get hasActiveAnimation(): boolean;
    /**
     * Plays an animation if there are any associated with the current model.
     * Accepts an optional string name of an animation to play. If no name is
     * provided, or if no animation is found by the given name, always falls back
     * to playing the first animation.
     */
    playAnimation(name?: string | null, crossfadeTime?: number): void;
    stopAnimation(): void;
    updateAnimation(step: number): void;
    /**
     * Call if the object has been changed in such a way that the shadow's shape
     * has changed (not a rotation about the Y axis).
     */
    updateShadow(): void;
    /**
     * Sets the shadow's intensity, lazily creating the shadow as necessary.
     */
    setShadowIntensity(shadowIntensity: number): void;
    /**
     * Sets the shadow's softness by mapping a [0, 1] softness parameter to the
     * shadow's resolution. This involves reallocation, so it should not be
     * changed frequently. Softer shadows are cheaper to render.
     */
    setShadowSoftness(softness: number): void;
    /**
     * The shadow must be rotated manually to match any global rotation applied to
     * this model. The input is the global orientation about the Y axis.
     */
    setShadowRotation(radiansY: number): void;
    /**
     * Call to check if the shadow needs an updated render; returns true if an
     * update is needed and resets the state.
     */
    isShadowDirty(): boolean;
    /**
     * Shift the floor vertically from the bottom of the model's bounding box by
     * offset (should generally be negative).
     */
    setShadowScaleAndOffset(scale: number, offset: number): void;
    /**
     * This method returns the world position and model-space normal of the point
     * on the mesh corresponding to the input pixel coordinates given relative to
     * the model-viewer element. If the mesh is not hit, the result is null.
     */
    positionAndNormalFromPoint(pixelPosition: Vector2, object?: Object3D): {
        position: Vector3;
        normal: Vector3;
    } | null;
    /**
     * The following methods are for operating on the set of Hotspot objects
     * attached to the scene. These come from DOM elements, provided to slots by
     * the Annotation Mixin.
     */
    addHotspot(hotspot: Hotspot): void;
    removeHotspot(hotspot: Hotspot): void;
    /**
     * Helper method to apply a function to all hotspots.
     */
    forHotspots(func: (hotspot: Hotspot) => void): void;
    /**
     * Update the CSS visibility of the hotspots based on whether their normals
     * point toward the camera.
     */
    updateHotspots(viewerPosition: Vector3): void;
    /**
     * Rotate all hotspots to an absolute orientation given by the input number of
     * radians. Zero returns them to upright.
     */
    orientHotspots(radians: number): void;
    /**
     * Set the rendering visibility of all hotspots. This is used to hide them
     * during transitions and such.
     */
    setHotspotsVisibility(visible: boolean): void;
}
