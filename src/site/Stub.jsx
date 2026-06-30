import { Label, Heading } from './Section.jsx';

// A section placeholder: just the header, with everything below it intentionally
// blank while the section is being built out.
export function UnderConstruction({ label, heading }) {
  return (
    <div>
      <Label>{label}</Label>
      <Heading>{heading}</Heading>
      <p className="mt-5 font-mono text-sm tracking-[1px] text-faint">Under construction</p>
    </div>
  );
}
