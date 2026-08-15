import React from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import { BodyogaLanding } from "../bodyoga/BodyogaLanding";
import HomeInstagram from "../home/HomeInstagram";
// Add more imports as components are updated to accept props

interface RenderBlocksProps {
  blocks: any[];
}

export const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="flex flex-col w-full">
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return (
              <BodyogaHeroSlider 
                key={block.id}
                initialSlides={[{
                  id: block.id,
                  title: block.props.title,
                  subtitle: block.props.subtitle,
                  button_label: block.props.buttonLabel,
                  button_link: block.props.buttonHref,
                  image_url: block.props.bgImage,
                  video_url: block.props.bgVideo,
                  overlay_opacity: block.props.overlay,
                  active: true
                } as any]}
              />
            );
          case "text":
            return (
              <section key={block.id} className="py-16 px-4 max-w-4xl mx-auto w-full">
                <div className={`text-${block.props.align || 'left'}`}>
                  {block.props.title && <h2 className="text-3xl md:text-4xl font-light mb-6 text-primary">{block.props.title}</h2>}
                  {block.props.content && <p className="text-lg text-primary/80 whitespace-pre-wrap">{block.props.content}</p>}
                </div>
              </section>
            );
          case "instagram":
            return <HomeInstagram key={block.id} />;
          case "spacer":
            return <div key={block.id} style={{ height: `${block.props.height}px` }} />;
          // Add more mappings
          default:
            return (
              <div key={block.id} className="p-8 border border-dashed border-gray-300 text-center text-gray-500">
                Bloco "{block.type}" em desenvolvimento
              </div>
            );
        }
      })}
    </div>
  );
};
