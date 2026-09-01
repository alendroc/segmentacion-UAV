import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCrearProyecto } from "@/features/proyectos/useCrearProyecto";
import { rutaDePaso } from "@/lib/pasos";

export function DialogoNuevoProyecto() {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [sitio, setSitio] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const idNombre = useId();
  const idSitio = useId();
  const idDescripcion = useId();

  const navegar = useNavigate();
  const crear = useCrearProyecto();

  function limpiar() {
    setNombre("");
    setSitio("");
    setDescripcion("");
    crear.reset();
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    crear.mutate(
      { nombre, sitio, descripcion },
      {
        onSuccess: (proyecto) => {
          setAbierto(false);
          limpiar();
          toast.success(`Proyecto "${proyecto.nombre}" creado`, {
            description: "El siguiente paso es cargar el ortomosaico.",
            action: {
              label: "Ir a la carga",
              onClick: () => navegar(rutaDePaso(proyecto.id, "carga")),
            },
          });
        },
      },
    );
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v);
        if (!v) limpiar();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          Nuevo proyecto
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={alEnviar}>
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Un proyecto agrupa un ortomosaico, sus detecciones y las
              correcciones hechas sobre ellas.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={idNombre}>Nombre</Label>
              <Input
                id={idNombre}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Lote Sur"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={idSitio}>Sitio</Label>
              <Input
                id={idSitio}
                value={sitio}
                onChange={(e) => setSitio(e.target.value)}
                placeholder="Nicoya, Guanacaste"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={idDescripcion}>Descripcion</Label>
              <Textarea
                id={idDescripcion}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Parcela permanente de monitoreo en bosque tropical seco."
                rows={3}
              />
            </div>

            {crear.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{crear.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={crear.isPending || !nombre.trim()}>
              {crear.isPending ? "Creando…" : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
